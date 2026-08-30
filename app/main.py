from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers.classify import router as classify_router
from app.routers.control_panel import router as control_panel_router
from app.routers.index import router as index_router
from app.routers.parse import router as parse_router
from app.routers.report import router as report_router

# Load environment variables (.env)
load_dotenv()

app = FastAPI(
    title="rnd-paper-canvas API",
    description="Akademik makale ve araştırma raporları analiz motoru - Step 5: Control Panel & Section Customization",
    version="0.5.0",
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


@app.get(
    "/health",
    tags=["Health"],
    summary="Sağlık kontrolü",
    description="Servisin ayakta olduğunu doğrulamak için sağlık kontrol endpoint'i.",
)
async def health_check() -> dict[str, str]:
    """Servis sağlık durumu döner."""
    return {"status": "ok"}
