from datetime import datetime
from typing import Any, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import get_async_db
from app.db.repository import DocumentRepository, ReportRepository, SectionRepository
from app.models.paper_profile import PaperProfile
from app.models.report_section import FilledSection, SourceReference
from app.storage.object_store import get_presigned_url

router = APIRouter(tags=["Documents & Historical Reports"])


class DocumentListItem(BaseModel):
    """Proje altındaki doküman özet modeli."""

    id: UUID
    original_filename: str
    storage_path: str
    uploaded_at: datetime
    processing_status: str


class HistoricalReportResponse(BaseModel):
    """Veritabanından okunan geçmiş rapor yanıt modeli."""

    document_id: UUID
    report_id: UUID
    version: int
    paper_profile: PaperProfile
    sections: list[FilledSection]
    generated_at: datetime


class OriginalDocumentUrlResponse(BaseModel):
    """MinIO geçici indirme URL yanıt modeli."""

    document_id: UUID
    original_filename: str
    download_url: str


@router.get(
    "/projects/{project_id}/documents",
    response_model=list[DocumentListItem],
    summary="Projedeki dokümanları listele",
    description="Belirtilen proje kimliğine ait silinmemiş tüm dokümanları yüklenme tarihine göre listeler.",
)
async def list_project_documents(
    project_id: UUID,
    db: AsyncSession = Depends(get_async_db),
) -> list[DocumentListItem]:
    """Proje dökümanlarını listeler."""
    repo = DocumentRepository(db)
    docs = await repo.list_by_project(project_id, include_deleted=False)
    return [
        DocumentListItem(
            id=d.id,
            original_filename=d.original_filename,
            storage_path=d.storage_path,
            uploaded_at=d.uploaded_at,
            processing_status=d.processing_status,
        )
        for d in docs
    ]


@router.get(
    "/documents/{document_id}/report",
    response_model=HistoricalReportResponse,
    summary="Dokümana ait en son raporu getir",
    description="Doküman için daha önce üretilmiş en güncel raporu ve bölümlerini veritabanından döner (yeniden LLM çalıştırmaz).",
)
async def get_document_report(
    document_id: UUID,
    db: AsyncSession = Depends(get_async_db),
) -> HistoricalReportResponse:
    """Kayıtlı raporu ve bölümlerini döner."""
    doc_repo = DocumentRepository(db)
    doc = await doc_repo.get_by_id(document_id)
    if not doc or doc.deleted_at is not None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doküman bulunamadı veya silinmiş.",
        )

    report_repo = ReportRepository(db)
    report = await report_repo.get_latest_by_document(document_id)
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bu doküman için henüz üretilmiş bir rapor bulunmuyor.",
        )

    section_repo = SectionRepository(db)
    db_sections = await section_repo.get_by_report(report.id)

    filled_sections: list[FilledSection] = []
    for s in db_sections:
        # DB content formatını FilledSection formatına dönüştür
        content = s.content if isinstance(s.content, dict) else {"text": str(s.content)}
        sources_raw = content.get("sources", [])
        sources = [
            SourceReference(
                page=src.get("page", 1),
                section_title=src.get("section_title", "General"),
            )
            for src in sources_raw
            if isinstance(src, dict)
        ]

        filled_sections.append(
            FilledSection(
                group_id=s.title.lower().replace(" ", "_"),
                title=s.title,
                content_type=s.section_type,
                content=content,
                sources=sources,
                diagram_requested=s.diagram is not None,
            )
        )

    return HistoricalReportResponse(
        document_id=doc.id,
        report_id=report.id,
        version=report.version,
        paper_profile=PaperProfile(**report.paper_profile),
        sections=filled_sections,
        generated_at=report.generated_at,
    )


@router.get(
    "/documents/{document_id}/original",
    response_model=OriginalDocumentUrlResponse,
    summary="Orijinal PDF için indirme bağlantısı al",
    description="MinIO nesne depolamasındaki orijinal PDF için 1 saat geçerli imzalı indirme URL'i döner.",
)
async def get_document_original_url(
    document_id: UUID,
    db: AsyncSession = Depends(get_async_db),
) -> OriginalDocumentUrlResponse:
    """MinIO imzalı indirme URL'i döner."""
    doc_repo = DocumentRepository(db)
    doc = await doc_repo.get_by_id(document_id)
    if not doc or doc.deleted_at is not None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doküman bulunamadı veya silinmiş.",
        )

    try:
        download_url = get_presigned_url(doc.storage_path, expires_seconds=3600)
        return OriginalDocumentUrlResponse(
            document_id=doc.id,
            original_filename=doc.original_filename,
            download_url=download_url,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"İndirme URL'i üretilirken hata oluştu: {str(e)}",
        )


@router.delete(
    "/documents/{document_id}",
    summary="Dokümanı sil (Soft delete)",
    description="Dokümanı soft delete yapar (deleted_at işaretler).",
)
async def delete_document_endpoint(
    document_id: UUID,
    db: AsyncSession = Depends(get_async_db),
) -> dict[str, str]:
    """Dokümanı soft delete yapar."""
    doc_repo = DocumentRepository(db)
    success = await doc_repo.soft_delete(document_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doküman bulunamadı.",
        )
    return {"status": "deleted", "document_id": str(document_id)}
