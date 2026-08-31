from typing import Any, Optional
from pydantic import BaseModel, Field
from app.models.report_section import FilledSection


class DiagramNode(BaseModel):
    """Diyagram düğüm nesnesi."""

    id: str = Field(
        ..., description="Kısa, benzersiz ve boşluksuz düğüm kimliği (örn: 'dataset', 'preprocess', 'model')"
    )
    label: str = Field(..., description="Kullanıcıya gösterilecek düğüm başlığı")


class DiagramEdge(BaseModel):
    """Diyagram bağlantı/kenar nesnesi."""

    from_id: str = Field(..., description="Başlangıç düğümünün id değeri")
    to_id: str = Field(..., description="Hedef düğümün id değeri")
    label: Optional[str] = Field(default=None, description="Ok üstü açıklama etiketi (opsiyonel)")


class DiagramSpec(BaseModel):
    """LLM tarafından üretilen ham graf spesifikasyonu."""

    nodes: list[DiagramNode] = Field(..., description="Diyagram düğümleri listesi (en fazla 8 adet)")
    edges: list[DiagramEdge] = Field(..., description="Düğümler arası bağlantılar listesi")
    diagram_type: str = Field(
        default="flowchart", description="Diyagram türü ('flowchart' | 'tree')"
    )


class GeneratedDiagram(BaseModel):
    """Nihai Mermaid kodu ve ham spesifikasyonu içeren üretilmiş diyagram nesnesi."""

    section_id: str = Field(..., description="Diyagramın ait olduğu bölümün group_id değeri")
    group_id: Optional[str] = Field(default=None, description="Bölüm grubu kimliği takma adı")
    mermaid_code: str = Field(..., description="Render edilmeye hazır deterministik Mermaid.js kodu")
    spec: DiagramSpec = Field(..., description="Ham JSON graf özellikleri")

    def __init__(self, **data: Any):
        if "group_id" in data and "section_id" not in data:
            data["section_id"] = data["group_id"]
        super().__init__(**data)
        if not self.group_id:
            self.group_id = self.section_id


class GenerateDiagramRequest(BaseModel):
    """POST /generate-diagram endpoint'i için istek şeması."""

    section: FilledSection = Field(..., description="Diyagram üretilecek doldurulmuş bölüm nesnesi")


class GenerateDiagramsBatchRequest(BaseModel):
    """POST /generate-diagrams-batch endpoint'i için istek şeması."""

    sections: list[FilledSection] = Field(
        ..., description="Diyagram üretimi talep edilen (diagram_requested=True) bölümler listesi"
    )


class FinalizeReportWithDiagramsResponse(BaseModel):
    """POST /control-panel/finalize endpoint'i için zenginleştirilmiş yanıt şeması."""

    document_id: str = Field(..., description="Döküman kimliği")
    sections: list[FilledSection] = Field(..., description="Filtrelenmiş ve sıralanmış final bölümler")
    diagrams: list[GeneratedDiagram] = Field(
        default_factory=list, description="Talep edilen ve üretilen diyagramlar listesi"
    )
