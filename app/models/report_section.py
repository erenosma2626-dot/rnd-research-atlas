from typing import Any, Optional
from pydantic import BaseModel, Field

from app.models.document import ParsedDocument
from app.models.formula import ExtractedFormula
from app.models.paper_profile import PaperProfile
from app.models.routing import ActiveSectionGroup


class SourceReference(BaseModel):
    """İçeriğin türetildiği kaynak sayfa ve bölüm referansı."""

    page: int = Field(..., description="Kaynak sayfa numarası (1-indexed)")
    section_title: str = Field(..., description="Kaynak bölüm başlığı")


class ModuleItem(BaseModel):
    """Sistem mimarisi ve bileşen adımları için yapısal modül nesnesi."""

    order: int = Field(..., description="Modülün sırası (1, 2, ...)")
    name: str = Field(..., description="Modülün Türkçe adı")
    short_label: Optional[str] = Field(default=None, description="Modülün orijinal İngilizce veya kısa etiketi")
    description: str = Field(..., description="Modülün görevi ve çalışma mantığı (LaTeX $...$ destekli)")


class ModuleListContent(BaseModel):
    """Module list içerik gövdesi."""

    modules: list[ModuleItem] = Field(default_factory=list)
    flow_summary: Optional[str] = Field(default=None, description="Modüller arası veri akışı özeti")


class FilledSection(BaseModel):
    """Doldurulmuş rapor bölümü nesnesi."""

    group_id: str = Field(..., description="Bölüm grubu kimliği (örn: 'ml_experiment_table')")
    title: str = Field(..., description="Bölüm grubu başlığı")
    content_type: str = Field(
        ..., description="İçerik türü ('prose' | 'table' | 'list' | 'module_list' | 'image_gallery' | 'chart' | 'error')"
    )
    content: dict[str, Any] = Field(
        ..., description="Yapılandırılmış içerik (prose: text, table: columns/rows, list: items, module_list: modules/flow_summary)"
    )
    diagram: Optional[dict[str, Any]] = Field(
        default=None, description="Bu bölüme eklenmiş diyagram nesnesi"
    )
    sources: list[SourceReference] = Field(
        default_factory=list, description="İçeriğin çekildiği kaynak referansları"
    )
    diagram_requested: bool = Field(
        default=False, description="Kullanıcının bu bölüm için diyagram üretimi talep edip etmediği"
    )

    @property
    def section_id(self) -> str:
        return self.group_id



class GenerateReportRequest(BaseModel):
    """POST /generate-report endpoint'i için istek şeması."""

    document_id: str = Field(..., description="Döküman kimliği (ChromaDB'de indekslenmiş)")
    active_sections: list[ActiveSectionGroup] = Field(
        ..., description="Doldurulacak aktif bölüm grupları"
    )
    parsed_document: ParsedDocument = Field(..., description="Ayrıştırılmış doküman nesnesi")


class GenerateReportResponse(BaseModel):
    """POST /generate-report endpoint'i için yanıt şeması."""

    document_id: str = Field(..., description="Döküman kimliği")
    sections: list[FilledSection] = Field(..., description="Doldurulan rapor bölümleri listesi")


class FullPipelineResponse(BaseModel):
    """POST /full-pipeline uçtan uca boru hattı yanıt şeması."""

    document_id: str = Field(..., description="Oluşturulan döküman kimliği")
    paper_profile: PaperProfile = Field(..., description="Makale profili ve bayrakları")
    sections: list[FilledSection] = Field(
        ..., description="Üretilen nihai rapor bölümleri listesi"
    )
    formulas: list[ExtractedFormula] = Field(
        default_factory=list, description="Çıkarılan ve LaTeX'e dönüştürülen formüller listesi"
    )
