from datetime import datetime
import os
import shutil
import tempfile
from typing import Any, Optional
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.auth.permissions import ROLE_HIERARCHY, require_role
from app.config.constants import DEFAULT_PROJECT_ID
from app.db.base import get_async_db
from app.db.models import ProjectMember, User
from app.db.repository import (
    DocumentRepository,
    InventoryRepository,
    ProjectMemberRepository,
    ProjectRepository,
    ReportRepository,
    SectionRepository,
)
from app.models.figure import ExtractedFigure
from app.models.paper_profile import PaperProfile
from app.models.report_section import FilledSection, SourceReference
from app.storage.object_store import get_presigned_url, upload_file
from app.worker.tasks import process_document_task

router = APIRouter(tags=["Documents & Historical Reports"])


class CanvasUsage(BaseModel):
    canvas_id: UUID
    canvas_name: str


class UserSummary(BaseModel):
    id: UUID
    display_name: str
    email: str


class InventoryItemResponse(BaseModel):
    id: UUID
    original_filename: str
    storage_path: str
    uploaded_at: datetime
    added_at: datetime
    added_by: UserSummary
    is_own: bool = True
    processing_status: str
    used_in_canvases: list[CanvasUsage] = []


class AddExistingDocumentRequest(BaseModel):
    document_id: UUID = Field(..., description="Projeye eklenecek doküman kimliği")


class DocumentListItem(BaseModel):
    """Proje altındaki doküman özet modeli."""

    id: UUID
    original_filename: str
    storage_path: str
    uploaded_at: datetime
    processing_status: str
    error_message: Optional[str] = None


class DocumentStatusResponse(BaseModel):
    """Doküman işlem durumu sorgulama yanıtı."""

    document_id: UUID
    original_filename: str
    processing_status: str
    error_message: Optional[str] = None
    uploaded_at: datetime


class UploadDocumentResponse(BaseModel):
    """Asenkron doküman yükleme anlık yanıtı."""

    document_id: UUID
    original_filename: str
    processing_status: str = "pending"
    message: str = "Doküman kuyruğa alındı ve arka planda işleniyor."


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


@router.post(
    "/documents/upload",
    response_model=UploadDocumentResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Asenkron PDF Yükleme ve İşleme Kuyruğuna Alma",
    description="PDF dosyasını yükler, MinIO'ya ve veritabanına kaydeder, analizi Celery kuyruğuna atıp anında döner.",
)
async def upload_document_async(
    file: UploadFile = File(...),
    project_id: Optional[UUID] = Query(default=None, description="Dokümanın ekleneceği proje kimliği (Opsiyonel)"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
) -> UploadDocumentResponse:
    """PDF'i MinIO'ya kaydeder ve Celery arka plan işlem görevini tetikler."""
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Geçersiz dosya formatı. Lütfen bir PDF dosyası yükleyin.",
        )

    # 1. Hedef projeyi belirle ve yetkiyi kontrol et
    proj_repo = ProjectRepository(db)
    member_repo = ProjectMemberRepository(db)

    target_project_id = project_id
    if not target_project_id or target_project_id == DEFAULT_PROJECT_ID:
        user_projects = await proj_repo.list_by_user(current_user.id)
        if user_projects:
            first_p = user_projects[0]
            target_project_id = first_p["id"] if isinstance(first_p, dict) else first_p.id
        else:
            new_proj = await proj_repo.create(owner_id=current_user.id, name="Varsayılan Proje")
            target_project_id = new_proj.id

    member = await member_repo.get_member(target_project_id, current_user.id)
    if not member:
        project = await proj_repo.get_by_id(target_project_id)
        if project and project.owner_id == current_user.id:
            member = await member_repo.add_member(target_project_id, current_user.id, "owner")
        else:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Bu projeye doküman yükleme yetkiniz bulunmuyor.",
            )

    user_role = member.role if isinstance(member, ProjectMember) else "owner"
    if ROLE_HIERARCHY.get(user_role, 0) < ROLE_HIERARCHY.get("editor", 1):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Bu projeye doküman yüklemek için en az 'editor' rolü gereklidir. Mevcut rolünüz: '{user_role}'.",
        )

    doc_uuid = uuid4()

    # 2. Dosyayı geçici diske yaz
    temp_dir = tempfile.gettempdir()
    temp_file_path = os.path.join(temp_dir, f"doc_{doc_uuid}.pdf")
    try:
        with open(temp_file_path, "wb") as f:
            shutil.copyfileobj(file.file, f)
    except Exception as e:
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Dosya diske kaydedilirken hata oluştu: {str(e)}",
        )

    # 3. MinIO'ya Yükle
    storage_path = f"s3://documents/papers/{doc_uuid}/{file.filename}"
    try:
        storage_path = upload_file(
            file_path=temp_file_path,
            bucket="documents",
            object_name=f"papers/{doc_uuid}/{file.filename}",
        )
    except Exception:
        pass

    # 4. DB'de Document ve ProjectDocument Kayıtlarını Aç
    doc_repo = DocumentRepository(db)
    try:
        await doc_repo.create(
            original_filename=file.filename,
            storage_path=storage_path,
            document_id=doc_uuid,
            processing_status="pending",
        )
        await doc_repo.add_to_project(
            project_id=target_project_id,
            document_id=doc_uuid,
            added_by=current_user.id,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Doküman veritabanına kaydedilemedi: {str(e)}",
        )

    # 5. Celery Görevini Tetikle
    try:
        process_document_task.delay(
            document_id=str(doc_uuid),
            file_path=temp_file_path,
            project_id=str(target_project_id),
        )
    except Exception:
        pass

    return UploadDocumentResponse(
        document_id=doc_uuid,
        original_filename=file.filename,
        processing_status="pending",
    )


@router.get(
    "/documents/{document_id}/status",
    response_model=DocumentStatusResponse,
    summary="Doküman İşlem Durumunu Sorgula (Polling)",
    description="Dokümanın arka plan işlem durumunu (pending, processing, done, failed) ve hata mesajını döner.",
)
async def get_document_status(
    document_id: UUID,
    db: AsyncSession = Depends(get_async_db),
) -> DocumentStatusResponse:
    """Dokümanın işlem durumunu döner."""
    doc_repo = DocumentRepository(db)
    doc = await doc_repo.get_by_id(document_id)
    if not doc or doc.deleted_at is not None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doküman bulunamadı veya silinmiş.",
        )

    return DocumentStatusResponse(
        document_id=doc.id,
        original_filename=doc.original_filename,
        processing_status=doc.processing_status,
        error_message=doc.error_message,
        uploaded_at=doc.uploaded_at,
    )


@router.get(
    "/projects/{project_id}/documents",
    response_model=list[DocumentListItem],
    summary="Projedeki dokümanları listele",
    description="Belirtilen proje kimliğine ait silinmemiş tüm dokümanları yüklenme tarihine göre listeler.",
)
async def list_project_documents(
    project_id: UUID,
    _: ProjectMember = Depends(require_role("viewer")),
    current_user: User = Depends(get_current_user),
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
            error_message=d.error_message,
        )
        for d in docs
    ]


@router.get(
    "/projects/{project_id}/inventory",
    response_model=list[InventoryItemResponse],
    summary="Projedeki doküman envanterini ve canvas kullanım durumunu listele",
    description="Projedeki tüm dokümanları ve her birinin hangi canvas'larda eklendiğini listeler.",
)
async def get_project_inventory(
    project_id: UUID,
    _: ProjectMember = Depends(require_role("viewer")),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
) -> list[InventoryItemResponse]:
    """Proje doküman envanteri, ekleyen kişi ve canvas kullanım durumunu döner."""
    inv_repo = InventoryRepository(db)
    items = await inv_repo.get_project_inventory(project_id, current_user_id=current_user.id)
    return [
        InventoryItemResponse(
            id=item["id"],
            original_filename=item["original_filename"],
            storage_path=item["storage_path"],
            uploaded_at=item["uploaded_at"],
            added_at=item.get("added_at", item["uploaded_at"]),
            added_by=UserSummary(
                id=item["added_by"]["id"],
                display_name=item["added_by"]["display_name"],
                email=item["added_by"]["email"],
            ),
            is_own=item.get("is_own", True),
            processing_status=item["processing_status"],
            used_in_canvases=[
                CanvasUsage(canvas_id=u["canvas_id"], canvas_name=u["canvas_name"])
                for u in item.get("used_in_canvases", [])
            ],
        )
        for item in items
    ]


@router.post(
    "/projects/{project_id}/documents",
    response_model=dict[str, Any],
    status_code=status.HTTP_201_CREATED,
    summary="Mevcut bir dokümanı projeye bağla (Kopyalamadan ilişkilendir)",
)
async def add_existing_document_to_project(
    project_id: UUID,
    request: AddExistingDocumentRequest,
    _: ProjectMember = Depends(require_role("editor")),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
) -> dict[str, Any]:
    """Mevcut bir dokümanı projeye ekler ve ekleyen kişiyi current_user olarak kaydeder."""
    doc_repo = DocumentRepository(db)
    doc = await doc_repo.get_by_id(request.document_id)
    if not doc or doc.deleted_at is not None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doküman bulunamadı.",
        )

    try:
        await doc_repo.add_to_project(
            project_id=project_id,
            document_id=request.document_id,
            added_by=current_user.id,
        )
    except Exception as e:
        # Zaten ekliyse de başarılı say
        pass

    return {
        "status": "added",
        "project_id": str(project_id),
        "document_id": str(request.document_id),
        "original_filename": doc.original_filename,
    }


@router.get(
    "/documents/{document_id}/report",
    response_model=HistoricalReportResponse,
    summary="Dokümana ait en son raporu getir",
    description="Doküman için daha önce üretilmiş en güncel raporu ve bölümlerini veritabanından döner (yeniden LLM çalıştırmaz).",
)
async def get_document_report(
    document_id: UUID,
    current_user: User = Depends(get_current_user),
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

        raw_figures = content.get("figures", [])
        parsed_figures: list[ExtractedFigure] = []
        for rf in raw_figures:
            if isinstance(rf, dict):
                try:
                    parsed_figures.append(ExtractedFigure(**rf))
                except Exception:
                    pass

        key_finding = content.get("key_finding")

        filled_sections.append(
            FilledSection(
                id=str(s.id),
                group_id=s.title.lower().replace(" ", "_"),
                outline_id=str(s.id),
                title=s.title,
                content_type=s.section_type,
                content=content,
                order=s.order,
                diagram=s.diagram,
                figures=parsed_figures,
                key_finding=key_finding,
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
    current_user: User = Depends(get_current_user),
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
    current_user: User = Depends(get_current_user),
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
