from typing import Any, Optional
from pydantic import BaseModel, Field
from app.models.section_candidate import SectionCandidate


class FigureCandidate(BaseModel):
    figure_id: str
    caption: Optional[str] = None
    image_url: str
    included: bool = True
    order: int = 1


class PlanState(BaseModel):
    document_id: str
    active_sections: list[SectionCandidate]
    extracted_figures: list[FigureCandidate] = Field(default_factory=list)
    paper_profile: Optional[dict[str, Any]] = None
    parsed_doc: Optional[dict[str, Any]] = None


class ApprovePlanRequest(BaseModel):
    plan_state: Optional[PlanState] = None

