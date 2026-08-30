import os
import shutil
import tempfile
import uuid
from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.constants import DEFAULT_PROJECT_ID, DEFAULT_USER_ID
from app.db.base import get_async_db
from app.db.repository import DocumentRepository, ReportRepository, SectionRepository
from app.models.report_section import (
    FullPipelineResponse,
    GenerateReportRequest,
    GenerateReportResponse,
)
from app.parsers.docling_parser import parse_pdf
from app.services.classifier import classify_paper
from app.services.formula_extractor import extract_all_formulas
from app.services.section_router import route_sections
from app.services.slot_filler import fill_all_sections
from app.services.vector_store import index_document
from app.storage.object_store import upload_file

router = APIRouter(tags=["Report Generation"])


@router.post(
    "/generate-report",
    response_model=GenerateReportResponse,
    summary="Aktif bölümler için rapor içeriğini üret",
    description="ChromaDB'den ilgili chunk'ları çekerek her aktif bölüm için yapılandırılmış (prose/table/list) içerik üretir.",
)
async def generate_report_endpoint(
    request: GenerateReportRequest,
) -> GenerateReportResponse:
    """Aktif bölümleri LLM ile doldurur ve rapor oluşturur."""
    try:
        sections = fill_all_sections(
            document_id=request.document_id,
            active_groups=request.active_sections,
            parsed_doc=request.parsed_document,
        )
        return GenerateReportResponse(
            document_id=request.document_id,
            sections=sections,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Rapor oluşturulurken hata meydana geldi: {str(e)}",
        )


@router.post(
    "/full-pipeline",
    response_model=FullPipelineResponse,
    summary="Uçtan Uca Tam Boru Hattı (Kalıcı DB + MinIO)",
    description="PDF dosyasını alır: MinIO'ya yükler -> DB kaydı açar -> Parse -> Formula -> Classify -> Index -> Route -> Slot Fill -> DB'ye kaydeder.",
)
async def full_pipeline_endpoint(
    file: UploadFile = File(...),
    project_id: UUID = Query(default=DEFAULT_PROJECT_ID, description="Dokümanın ekleneceği proje kimliği"),
    db: AsyncSession = Depends(get_async_db),
) -> FullPipelineResponse:
    """Tüm analiz, formül çıkarma ve rapor üretim boru hattını çalıştırır ve veritabanına kaydeder."""
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Geçersiz dosya formatı. Lütfen bir PDF dosyası yükleyin.",
        )

    doc_uuid = uuid.uuid4()
    document_id = str(doc_uuid)

    suffix = ".pdf"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
        temp_path = temp_file.name
        try:
            shutil.copyfileobj(file.file, temp_file)
        except Exception as e:
            if os.path.exists(temp_path):
                os.remove(temp_path)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Dosya kaydedilirken hata oluştu: {str(e)}",
            )

    doc_repo = DocumentRepository(db)
    report_repo = ReportRepository(db)
    section_repo = SectionRepository(db)

    # Varsayılan kullanıcı ve projeyi garantiye al
    from app.db.seed import seed_default_user_and_project
    try:
        await seed_default_user_and_project(db)
    except Exception:
        pass

    # 1. MinIO'ya Yükle ve DB'de Document / ProjectDocument Kayıtlarını Aç
    storage_path = f"s3://documents/papers/{document_id}/{file.filename}"
    try:
        storage_path = upload_file(
            file_path=temp_path,
            bucket="documents",
            object_name=f"papers/{document_id}/{file.filename}",
        )
    except Exception as e:
        # MinIO yoksa veya ulaşılamazsa fallback URI ata
        pass

    try:
        await doc_repo.create(
            original_filename=file.filename,
            storage_path=storage_path,
            document_id=doc_uuid,
            processing_status="processing",
        )
        await doc_repo.add_to_project(
            project_id=project_id,
            document_id=doc_uuid,
            added_by=DEFAULT_USER_ID,
        )
    except Exception:
        # DB yoksa veya migration henüz yapılmadıysa pipeline'ın devam etmesine izin ver
        pass

    try:
        # Step 1: Docling Parsing
        parsed_doc = parse_pdf(temp_path)
    except Exception as e:
        try:
            await doc_repo.update_status(doc_uuid, "failed")
        except Exception:
            pass
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"PDF parse edilirken hata oluştu: {str(e)}",
        )
    finally:
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except OSError:
                pass

    try:
        # Step 8: Formula Extraction (LaTeX Capture)
        extracted_formulas = extract_all_formulas(parsed_doc.formulas)
    except Exception:
        extracted_formulas = []

    try:
        # Step 2: Groq Classification
        profile = classify_paper(parsed_doc)
    except Exception as e:
        try:
            await doc_repo.update_status(doc_uuid, "failed")
        except Exception:
            pass
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Sınıflandırma aşamasında hata oluştu: {str(e)}",
        )

    try:
        # Step 3: ChromaDB Indexing & Section Routing
        index_document(document_id, parsed_doc)
        active_sections = route_sections(profile)
    except Exception as e:
        try:
            await doc_repo.update_status(doc_uuid, "failed")
        except Exception:
            pass
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Vektör indeksleme veya yönlendirme aşamasında hata: {str(e)}",
        )

    try:
        # Step 4: Slot Filling (formül zenginleştirmeli)
        filled_sections = fill_all_sections(
            document_id=document_id,
            active_groups=active_sections,
            parsed_doc=parsed_doc,
            extracted_formulas=extracted_formulas,
            paper_profile=profile,
        )

        # Step 11: DB'ye Raporu ve Bölümleri Kaydet
        try:
            report_record = await report_repo.create(
                document_id=doc_uuid,
                paper_profile=profile.model_dump(),
                version=1,
            )
            sections_data = [
                {
                    "content_type": sec.content_type,
                    "title": sec.title,
                    "content": sec.content,
                    "order": idx + 1,
                    "diagram": None,
                }
                for idx, sec in enumerate(filled_sections)
            ]
            await section_repo.create_many(
                report_id=report_record.id,
                sections_data=sections_data,
            )
            await doc_repo.update_status(doc_uuid, "done")
        except Exception:
            pass

        return FullPipelineResponse(
            document_id=document_id,
            paper_profile=profile,
            sections=filled_sections,
            formulas=extracted_formulas,
        )
    except Exception as e:
        try:
            await doc_repo.update_status(doc_uuid, "failed")
        except Exception:
            pass
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Rapor doldurma aşamasında hata oluştu: {str(e)}",
        )
