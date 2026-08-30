from typing import Optional
from pydantic import BaseModel, Field
from app.models.document import ParsedDocument


class ExtractedFormula(BaseModel):
    """Genişletilmiş ve LaTeX'e dönüştürülmüş formül nesnesi."""

    raw_text: str = Field(..., description="Docling'in çıkardığı ham formül metni")
    page: int = Field(..., description="Formülün bulunduğu sayfa numarası (1-indexed)")
    latex_code: Optional[str] = Field(
        default=None, description="Başarılı çeviri sonucu elde edilen LaTeX kodu"
    )
    method: str = Field(
        default="pix2tex", description="Kullanılan çıkarma yöntemi ('pix2tex' | 'llm_fallback' | 'failed')"
    )
    low_confidence: bool = Field(
        default=False,
        description="Düşük güven bayrağı (LLM fallback kullanıldığında her zaman True olur)",
    )


class ExtractFormulasRequest(BaseModel):
    """POST /extract-formulas endpoint'i için istek şeması."""

    document_id: str = Field(..., description="Döküman kimliği")
    parsed_document: ParsedDocument = Field(..., description="Ayrıştırılmış doküman nesnesi")


class ExtractFormulasResponse(BaseModel):
    """POST /extract-formulas endpoint'i için yanıt şeması."""

    document_id: str = Field(..., description="Döküman kimliği")
    formulas: list[ExtractedFormula] = Field(
        ..., description="LaTeX'e çevrilmiş ve güven skoru atanmış formüller listesi"
    )
