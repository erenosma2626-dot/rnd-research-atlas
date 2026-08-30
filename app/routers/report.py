import os
import shutil
import tempfile
import uuid
from fastapi import APIRouter, File, HTTPException, UploadFile, status

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
    summary="Uçtan Uca Tam Boru Hattı",
    description="PDF dosyasını alır: Parse -> Formula Extraction -> Classify -> Index -> Route -> Slot Fill işlemlerini sırayla yürüterek nihai raporu döner.",
)
async def full_pipeline_endpoint(
    file: UploadFile = File(...),
) -> FullPipelineResponse:
    """Tüm analiz, formül çıkarma ve rapor üretim boru hattını tek adımda çalıştırır."""
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Geçersiz dosya formatı. Lütfen bir PDF dosyası yükleyin.",
        )

    document_id = str(uuid.uuid4())

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

    try:
        # Step 1: Docling Parsing
        parsed_doc = parse_pdf(temp_path)
    except Exception as e:
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
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Sınıflandırma aşamasında hata oluştu: {str(e)}",
        )

    try:
        # Step 3: ChromaDB Indexing & Section Routing
        index_document(document_id, parsed_doc)
        active_sections = route_sections(profile)
    except Exception as e:
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
        return FullPipelineResponse(
            document_id=document_id,
            paper_profile=profile,
            sections=filled_sections,
            formulas=extracted_formulas,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Rapor doldurma aşamasında hata oluştu: {str(e)}",
        )
