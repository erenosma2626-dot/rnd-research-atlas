from app.routers.classify import router as classify_router
from app.routers.index import router as index_router
from app.routers.parse import router as parse_router

__all__ = ["parse_router", "classify_router", "index_router"]
