from typing import Optional
from pydantic import BaseModel, Field
from app.models.figure import ExtractedFigure


class Section(BaseModel):
    """Represents a structured section extracted from a document."""

    title: str = Field(..., description="Section title or heading")
    level: int = Field(
        ..., description="Heading hierarchy level (1 for top-level, 2 for subsection, etc.)"
    )
    text: str = Field(..., description="Extracted textual content of the section")
    page_start: int = Field(..., description="Starting page number (1-indexed)")
    page_end: int = Field(..., description="Ending page number (1-indexed)")


class Formula(BaseModel):
    """Represents an isolated mathematical formula extracted from a document."""

    raw_text: str = Field(..., description="Raw formula text or LaTeX extracted by Docling")
    page: int = Field(..., description="Page number where the formula appears (1-indexed)")
    latex_code: Optional[str] = Field(
        default=None, description="Clean LaTeX string representation"
    )
    method: str = Field(
        default="docling_raw", description="'pix2tex' | 'llm_fallback' | 'docling_raw' | 'failed'"
    )
    low_confidence: bool = Field(
        default=False, description="Whether the formula extraction is low confidence"
    )


class ParsedDocument(BaseModel):
    """Complete structured representation of a parsed PDF document."""

    sections: list[Section] = Field(
        default_factory=list, description="List of document sections ordered hierarchically"
    )
    formulas: list[Formula] = Field(
        default_factory=list, description="List of extracted formulas"
    )
    figures: list[ExtractedFigure] = Field(
        default_factory=list, description="List of extracted figures and diagrams"
    )
    raw_markdown: str = Field(
        ..., description="Complete raw markdown export of the document"
    )
    total_pages: int = Field(..., description="Total number of pages in the document")
