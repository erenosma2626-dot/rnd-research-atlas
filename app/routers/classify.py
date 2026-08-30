import os
import shutil
import tempfile
from fastapi import APIRouter, File, HTTPException, UploadFile, status

from app.models.paper_profile import (
    ClassifyRequest,
    PaperProfile,
    ParseAndClassifyResponse,
)
from app.parsers.docling_parser import parse_pdf
from app.services.classifier import classify_paper

router = APIRouter(tags=["Classification"])


@router.post(
    "/classify",
    response_model=PaperProfile,
    summary="Ayrıştırılmış dökümanı sınıflandır",
    description="ParsedDocument nesnesini girdi olarak alıp LLM ile 17 bağımsız bayrak ve PaperProfile çıkarır.",
)
async def classify_document_endpoint(request: ClassifyRequest) -> PaperProfile:
    """ParsedDocument üzerinde PaperProfile sınıflandırması yapar."""
    try:
        profile = classify_paper(request.parsed_document)
        return profile
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Sınıflandırma gerçekleştirilemedi: {str(e)}",
        )


@router.post(
    "/parse-and-classify",
    response_model=ParseAndClassifyResponse,
    summary="PDF yükle, ayrıştır ve sınıflandır",
    description="PDF dosyasını alır, Docling ile parse eder ve ardından LLM ile sınıflandırarak tek yanıtta döner.",
)
async def parse_and_classify_endpoint(
    file: UploadFile = File(...),
) -> ParseAndClassifyResponse:
    """PDF dosyasını ayrıştırır ve tek adımda PaperProfile ile birlikte döner."""
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Geçersiz dosya formatı. Lütfen bir PDF dosyası yükleyin.",
        )

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
        # Step 2: Classification
        profile = classify_paper(parsed_doc)
        return ParseAndClassifyResponse(
            parsed_document=parsed_doc,
            paper_profile=profile,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Sınıflandırma aşamasında hata oluştu: {str(e)}",
        )
