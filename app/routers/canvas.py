from datetime import datetime
from typing import Any, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.auth.permissions import require_role
from app.db.base import get_async_db
from app.db.models import ProjectMember, User
from app.db.repository import CanvasItemRepository, CanvasRepository, DocumentRepository

router = APIRouter(tags=["Canvas (Workspace)"])


# Pydantic Şemaları
class CreateCanvasRequest(BaseModel):
    name: str = Field(default="Ana Canvas", description="Canvas adı")


class CanvasResponse(BaseModel):
    id: UUID
    project_id: UUID
    name: str
    created_at: datetime


class CreateCanvasItemRequest(BaseModel):
    item_type: str = Field(..., description="'document_box' | 'note' | 'connection'")
    ref_id: Optional[UUID] = Field(default=None, description="Doküman kutucuğu ise Document.id")
    position_x: float = Field(default=0.0, description="X koordinatı")
    position_y: float = Field(default=0.0, description="Y koordinatı")
    content: Optional[dict[str, Any]] = Field(default=None, description="İçerik verisi")


class UpdateCanvasItemRequest(BaseModel):
    position_x: Optional[float] = Field(default=None, description="Yeni X koordinatı")
    position_y: Optional[float] = Field(default=None, description="Yeni Y koordinatı")
    content: Optional[dict[str, Any]] = Field(default=None, description="Güncellenen içerik")


class CanvasItemResponse(BaseModel):
    id: UUID
    canvas_id: UUID
    item_type: str
    ref_id: Optional[UUID] = None
    position_x: float
    position_y: float
    content: Optional[dict[str, Any]] = None
    # Ekstra yardımcı doküman metadata'sı
    document_title: Optional[str] = None
    document_status: Optional[str] = None


@router.post(
    "/projects/{project_id}/canvases",
    response_model=CanvasResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Proje altında yeni canvas oluştur",
)
async def create_canvas(
    project_id: UUID,
    request: CreateCanvasRequest,
    _: ProjectMember = Depends(require_role("editor")),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
) -> CanvasResponse:
    """Yeni canvas sayfası oluşturur."""
    repo = CanvasRepository(db)
    canvas = await repo.create(project_id=project_id, name=request.name)
    return CanvasResponse(
        id=canvas.id,
        project_id=canvas.project_id,
        name=canvas.name,
        created_at=canvas.created_at,
    )


@router.get(
    "/projects/{project_id}/canvases",
    response_model=list[CanvasResponse],
    summary="Projedeki canvas'ları listele",
)
async def list_project_canvases(
    project_id: UUID,
    _: ProjectMember = Depends(require_role("viewer")),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
) -> list[CanvasResponse]:
    """Projedeki tüm canvas'ları döner. Hiç yoksa varsayılan bir tane oluşturur."""
    repo = CanvasRepository(db)
    canvases = await repo.list_by_project(project_id)
    if not canvases:
        default_canvas = await repo.create(project_id, name="Ana Canvas")
        canvases = [default_canvas]

    return [
        CanvasResponse(
            id=c.id,
            project_id=c.project_id,
            name=c.name,
            created_at=c.created_at,
        )
        for c in canvases
    ]


@router.patch(
    "/canvases/{canvas_id}",
    response_model=CanvasResponse,
    summary="Canvas sayfasını yeniden adlandır",
)
async def rename_canvas(
    canvas_id: UUID,
    request: CreateCanvasRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
) -> CanvasResponse:
    """Canvas adını günceller."""
    repo = CanvasRepository(db)
    updated = await repo.rename(canvas_id, request.name)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Canvas bulunamadı.",
        )
    return CanvasResponse(
        id=updated.id,
        project_id=updated.project_id,
        name=updated.name,
        created_at=updated.created_at,
    )


@router.delete(
    "/canvases/{canvas_id}",
    summary="Canvas sayfasını sil (soft delete)",
)
async def delete_canvas(
    canvas_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
) -> dict[str, str]:
    """Canvas sayfasını siler."""
    repo = CanvasRepository(db)
    success = await repo.soft_delete(canvas_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Canvas bulunamadı.",
        )
    return {"status": "deleted", "canvas_id": str(canvas_id)}


@router.get(
    "/canvases/{canvas_id}/items",
    response_model=list[CanvasItemResponse],
    summary="Canvas üzerindeki tüm elemanları listele",
)
async def get_canvas_items(
    canvas_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
) -> list[CanvasItemResponse]:
    """Canvas elemanlarını ve doküman bilgilerini döner."""
    canvas_repo = CanvasRepository(db)
    canvas = await canvas_repo.get_by_id(canvas_id)
    if not canvas:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Canvas bulunamadı.",
        )

    item_repo = CanvasItemRepository(db)
    doc_repo = DocumentRepository(db)

    items = await item_repo.list_by_canvas(canvas_id)
    results: list[CanvasItemResponse] = []

    for it in items:
        doc_title = None
        doc_status = None
        if it.item_type == "document_box" and it.ref_id:
            doc = await doc_repo.get_by_id(it.ref_id)
            if doc:
                doc_title = doc.original_filename
                doc_status = doc.processing_status

        results.append(
            CanvasItemResponse(
                id=it.id,
                canvas_id=it.canvas_id,
                item_type=it.item_type,
                ref_id=it.ref_id,
                position_x=it.position_x,
                position_y=it.position_y,
                content=it.content,
                document_title=doc_title,
                document_status=doc_status,
            )
        )

    return results


@router.post(
    "/canvases/{canvas_id}/items",
    response_model=CanvasItemResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Canvas'a eleman ekle",
)
async def add_canvas_item(
    canvas_id: UUID,
    request: CreateCanvasItemRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
) -> CanvasItemResponse:
    """Canvas üzerine doküman kutucuğu, not veya bağlantı yerleştirir."""
    canvas_repo = CanvasRepository(db)
    canvas = await canvas_repo.get_by_id(canvas_id)
    if not canvas:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Canvas bulunamadı.",
        )

    item_repo = CanvasItemRepository(db)
    doc_repo = DocumentRepository(db)

    item = await item_repo.create(
        canvas_id=canvas_id,
        item_type=request.item_type,
        position_x=request.position_x,
        position_y=request.position_y,
        ref_id=request.ref_id,
        content=request.content,
    )

    doc_title = None
    doc_status = None
    if item.item_type == "document_box" and item.ref_id:
        doc = await doc_repo.get_by_id(item.ref_id)
        if doc:
            doc_title = doc.original_filename
            doc_status = doc.processing_status

    return CanvasItemResponse(
        id=item.id,
        canvas_id=item.canvas_id,
        item_type=item.item_type,
        ref_id=item.ref_id,
        position_x=item.position_x,
        position_y=item.position_y,
        content=item.content,
        document_title=doc_title,
        document_status=doc_status,
    )


@router.patch(
    "/canvas-items/{item_id}",
    response_model=CanvasItemResponse,
    summary="Canvas elemanının pozisyonunu ve içeriğini güncelle",
)
async def update_canvas_item_position(
    item_id: UUID,
    request: UpdateCanvasItemRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
) -> CanvasItemResponse:
    """Sürükleyip bırakma veya metin düzenleme sonrası günceller."""
    item_repo = CanvasItemRepository(db)
    updated = await item_repo.update_item(
        item_id=item_id,
        position_x=request.position_x,
        position_y=request.position_y,
        content=request.content,
    )
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Canvas elemanı bulunamadı.",
        )

    return CanvasItemResponse(
        id=updated.id,
        canvas_id=updated.canvas_id,
        item_type=updated.item_type,
        ref_id=updated.ref_id,
        position_x=updated.position_x,
        position_y=updated.position_y,
        content=updated.content,
    )


@router.delete(
    "/canvas-items/{item_id}",
    summary="Canvas elemanını sil",
)
async def delete_canvas_item(
    item_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
) -> dict[str, str]:
    """Canvas elemanını kaldırır."""
    item_repo = CanvasItemRepository(db)
    success = await item_repo.delete(item_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Canvas elemanı bulunamadı.",
        )
    return {"status": "deleted", "item_id": str(item_id)}
