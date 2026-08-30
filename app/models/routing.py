from pydantic import BaseModel, Field
from app.models.document import ParsedDocument
from app.models.paper_profile import PaperProfile


class ActiveSectionGroup(BaseModel):
    """Aktifleşen rapor bölüm grubu ve tetikleyici bayrakları."""

    group_id: str = Field(..., description="Bölüm grubu kimliği (örn: 'ml_experiment_table')")
    title: str = Field(..., description="Bölüm grubu başlığı (örn: 'Veri & Yöntem (ML)')")
    matched_flags: list[str] = Field(
        default_factory=list,
        description="Bu bölüm grubunu tetikleyen aktif bayrakların listesi",
    )


class IndexRequest(BaseModel):
    """POST /index endpoint'i için istek şeması."""

    document_id: str = Field(..., description="Dökümana ait benzersiz kimlik (UUID vb.)")
    parsed_document: ParsedDocument = Field(..., description="Ayrıştırılmış doküman nesnesi")


class IndexResponse(BaseModel):
    """POST /index endpoint'i için yanıt şeması."""

    status: str = Field(default="indexed", description="İndeksleme durumu")
    chunk_count: int = Field(..., description="Vektör veritabanına eklenen chunk sayısı")


class RouteSectionsRequest(BaseModel):
    """POST /route-sections endpoint'i için istek şeması."""

    paper_profile: PaperProfile = Field(..., description="Makale profili nesnesi")


class ParseClassifyIndexResponse(BaseModel):
    """POST /parse-classify-index birleşik pipeline yanıt şeması."""

    document_id: str = Field(..., description="Oluşturulan döküman kimliği (UUID)")
    parsed_document: ParsedDocument = Field(..., description="Ayrıştırılmış döküman nesnesi")
    paper_profile: PaperProfile = Field(..., description="Tespit edilen makale profili")
    active_sections: list[ActiveSectionGroup] = Field(
        ..., description="Aktifleşen rapor bölüm grupları"
    )
