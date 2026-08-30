from typing import Any
from pydantic import BaseModel, Field

from app.models.document import ParsedDocument
from app.models.paper_profile import PaperProfile
from app.models.routing import ActiveSectionGroup


class SourceReference(BaseModel):
    """İçeriğin türetildiği kaynak sayfa ve bölüm referansı."""

    page: int = Field(..., description="Kaynak sayfa numarası (1-indexed)")
    section_title: str = Field(..., description="Kaynak bölüm başlığı")


class FilledSection(BaseModel):
    """Doldurulmuş rapor bölümü nesnesi."""

    group_id: str = Field(..., description="Bölüm grubu kimliği (örn: 'ml_experiment_table')")
    title: str = Field(..., description="Bölüm grubu başlığı")
    content_type: str = Field(
        ..., description="İçerik türü ('prose' | 'table' | 'list' | 'error')"
    )
    content: dict[str, Any] = Field(
        ..., description="Yapılandırılmış içerik (prose: text, table: columns/rows, list: items)"
    )
    sources: list[SourceReference] = Field(
        default_factory=list, description="İçeriğin çekildiği kaynak referansları"
    )


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
