import os
import shutil
import tempfile
from fastapi import APIRouter, File, HTTPException, UploadFile, status

from app.models.document import ParsedDocument
from app.parsers.docling_parser import parse_pdf

router = APIRouter(tags=["Parsing"])


@router.post(
    "/parse",
    response_model=ParsedDocument,
    summary="PDF dökümanını parse et",
    description="Yüklenen PDF dosyasını Docling kullanarak layout-aware biçimde analiz eder ve yapılandırılmış JSON döner.",
)
async def parse_document(file: UploadFile = File(...)) -> ParsedDocument:
    """PDF dosyasını alır, geçici olarak kaydeder ve ParsedDocument nesnesine dönüştürür."""
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Geçersiz dosya formatı. Lütfen bir PDF dosyası yükleyin.",
        )

    # Geçici dosyaya yazma
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
        parsed_result = parse_pdf(temp_path)
        return parsed_result
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
