from app.routers.classify import router as classify_router
from app.routers.control_panel import router as control_panel_router
from app.routers.diagram import router as diagram_router
from app.routers.index import router as index_router
from app.routers.parse import router as parse_router
from app.routers.report import router as report_router

__all__ = [
    "parse_router",
    "classify_router",
    "index_router",
    "report_router",
    "control_panel_router",
    "diagram_router",
]
