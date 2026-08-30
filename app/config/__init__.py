"""Configuration package for rnd-paper-canvas."""
from app.config.diagram_eligibility import DIAGRAM_ELIGIBLE_GROUPS
from app.config.section_prompts import SECTION_PROMPTS
from app.config.section_schema import SECTION_GROUPS

__all__ = [
    "SECTION_GROUPS",
    "SECTION_PROMPTS",
    "DIAGRAM_ELIGIBLE_GROUPS",
]
