from pydantic import BaseModel, Field
from app.models.report_section import FilledSection


class SectionCandidate(BaseModel):
    """Kontrol panelinde gösterilen aday rapor bölümü nesnesi."""

    section_id: str = Field(
        ..., description="Bölüm grubu kimliği (section_schema.py'deki group_id ile aynı)"
    )
    section_title: str = Field(..., description="Bölüm başlığı")
    detected: bool = Field(
        default=True, description="Bu bölüm pipeline tarafından tespit edildi mi"
    )
    included: bool = Field(
        default=True, description="Kullanıcı bu bölümü rapora dahil etmek istiyor mu"
    )
    order: int = Field(
        ..., description="Bölümün rapordaki sıralama indeksi (0, 1, 2...)"
    )
    diagram_available: bool = Field(
        ..., description="Bu bölüm için diyagram şablonu/üretimi uygun mu"
    )
    diagram_included: bool = Field(
        default=False, description="Kullanıcı bu bölüm için diyagram üretilmesini istiyor mu"
    )
    content_preview: str = Field(
        ..., description="Kullanıcıya kontrol panelinde gösterilecek kısa içerik önizlemesi"
    )


class ControlPanelState(BaseModel):
    """Kontrol panelinin güncel döküman durum şeması."""

    document_id: str = Field(..., description="Döküman kimliği")
    candidates: list[SectionCandidate] = Field(
        ..., description="Yapılandırılmış aday bölüm listesi"
    )


class BuildControlPanelRequest(BaseModel):
    """POST /control-panel/build endpoint'i için istek şeması."""

    document_id: str = Field(..., description="Döküman kimliği")
    filled_sections: list[FilledSection] = Field(
        ..., description="Doldurulmuş bölüm listesi"
    )


class FinalizeReportRequest(BaseModel):
    """POST /control-panel/finalize endpoint'i için istek şeması."""

    document_id: str = Field(..., description="Döküman kimliği")
    filled_sections: list[FilledSection] = Field(
        ..., description="Doldurulmuş bölüm listesi"
    )
    control_panel_state: ControlPanelState = Field(
        ..., description="Kullanıcının onayladığı kontrol paneli durumu"
    )
