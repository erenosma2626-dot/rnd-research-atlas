import logging
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.db.base import get_async_db
from app.db.models import User
from app.db.repository import DocumentRepository
from app.models.plan import ApprovePlanRequest, PlanState
from app.worker.tasks import generate_final_report_task

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Document Plan"])


@router.get(
    "/documents/{document_id}/plan",
    response_model=PlanState,
    summary="Dokümanın ön-üretim planını ve figür adaylarını getir",
)
async def get_document_plan_endpoint(
    document_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
) -> PlanState:
    """Dokümanın oluşturulan plan adaylarını döner."""
    doc_repo = DocumentRepository(db)
    doc = await doc_repo.get_by_id(document_id)
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doküman bulunamadı.",
        )

    if not doc.plan_state:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Doküman için henüz bir plan oluşturulmamış veya ayrıştırma tamamlanmamış.",
        )

    return PlanState(**doc.plan_state)


@router.patch(
    "/documents/{document_id}/plan",
    response_model=PlanState,
    summary="Dokümanın ön-üretim planını güncelle",
)
async def update_document_plan_endpoint(
    document_id: UUID,
    plan_state: PlanState,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
) -> PlanState:
    """Kullanıcının bölüm/figür seçimlerini ve sıralamasını günceller."""
    doc_repo = DocumentRepository(db)
    doc = await doc_repo.get_by_id(document_id)
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doküman bulunamadı.",
        )

    await doc_repo.update_plan_state(document_id, plan_state.model_dump())
    await db.commit()
    return plan_state


@router.post(
    "/documents/{document_id}/plan/approve",
    status_code=status.HTTP_202_ACCEPTED,
    summary="Planı onayla ve nihai rapor üretimini tetikle",
)
async def approve_document_plan_endpoint(
    document_id: UUID,
    request: ApprovePlanRequest = ApprovePlanRequest(),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
) -> dict[str, str]:
    """Onaylanan plana göre rapor üretim görevini asenkron olarak tetikler."""
    doc_repo = DocumentRepository(db)
    doc = await doc_repo.get_by_id(document_id)
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doküman bulunamadı.",
        )

    plan_dict = None
    if request.plan_state:
        plan_dict = request.plan_state.model_dump()
        await doc_repo.update_plan_state(document_id, plan_dict)
    elif doc.plan_state:
        plan_dict = doc.plan_state

    await doc_repo.update_status(document_id, "generating_report")
    await db.commit()

    # Celery görevini tetikle
    generate_final_report_task.delay(str(document_id), plan_dict)
    logger.info(f"Nihai rapor üretimi tetiklendi: {document_id}")

    return {
        "status": "generating_report",
        "document_id": str(document_id),
        "message": "Plan onaylandı, rapor üretimi başlatıldı.",
    }
