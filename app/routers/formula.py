from fastapi import APIRouter, HTTPException, status

from app.models.formula import ExtractFormulasRequest, ExtractFormulasResponse
from app.services.formula_extractor import extract_all_formulas

router = APIRouter(tags=["Formula Extraction"])


@router.post(
    "/extract-formulas",
    response_model=ExtractFormulasResponse,
    summary="Dokümandaki formülleri LaTeX'e çevir",
    description="ParsedDocument nesnesindeki ham formülleri pix2tex veya Groq LLM fallback ile LaTeX formatına dönüştürür.",
)
async def extract_formulas_endpoint(
    request: ExtractFormulasRequest,
) -> ExtractFormulasResponse:
    """Ham formül metinlerini LaTeX'e dönüştürür."""
    try:
        extracted = extract_all_formulas(request.parsed_document.formulas)
        return ExtractFormulasResponse(
            document_id=request.document_id,
            formulas=extracted,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Formül çıkarma sırasında hata oluştu: {str(e)}",
        )
