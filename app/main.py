from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db.seed import seed_default_user_and_project
from app.routers.canvas import router as canvas_router
from app.routers.chat import router as chat_router
from app.routers.classify import router as classify_router
from app.routers.control_panel import router as control_panel_router
from app.routers.diagram import router as diagram_router
from app.routers.documents import router as documents_router
from app.routers.formula import router as formula_router
from app.routers.index import router as index_router
from app.routers.invites import router as invites_router
from app.routers.parse import router as parse_router
from app.routers.report import router as report_router
from app.routers.sections import router as sections_router

# Load environment variables (.env)
load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """FastAPI uygulama yaşam döngüsü yöneticisi."""
    try:
        await seed_default_user_and_project()
    except Exception as e:
        print(f"Startup Seed uyarısı: {e}")
    yield


app = FastAPI(
    title="rnd-paper-canvas API",
    description="Akademik makale ve araştırma raporları analiz motoru & görsel çalışma alanı (Canvas)",
    version="0.14.0",
    lifespan=lifespan,
)

# CORS middleware for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(parse_router)
app.include_router(classify_router)
app.include_router(index_router)
app.include_router(report_router)
app.include_router(control_panel_router)
app.include_router(diagram_router)
app.include_router(chat_router)
app.include_router(formula_router)
app.include_router(documents_router)
app.include_router(canvas_router)
app.include_router(invites_router)
app.include_router(sections_router)


@app.get(
    "/health",
    tags=["Health"],
    summary="Sağlık kontrolü",
    description="Servisin ayakta olduğunu doğrulamak için sağlık kontrol endpoint'i.",
)
async def health_check() -> dict[str, str]:
    """Servis sağlık durumu döner."""
    return {"status": "ok"}
