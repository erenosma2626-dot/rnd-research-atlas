from typing import Any, Optional
from uuid import UUID
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.auth.permissions import require_role
from app.db.base import get_async_db
from app.db.models import User
from app.db.repository import NoteRepository, ProjectMemberRepository, ReportRepository, SectionRepository

router = APIRouter(tags=["Sections"])


class CreateSectionRequest(BaseModel):
    title: str = Field(..., description="Bölüm başlığı")
    content_type: str = Field(default="prose", description="İçerik türü: prose | list | table | image_gallery | chart")
    content: dict[str, Any] = Field(..., description="Bölüm içeriği nesnesi")
    order: int = Field(default=1, description="Bölüm sırası")


class UpdateSectionRequest(BaseModel):
    title: Optional[str] = Field(default=None, description="Yeni başlık")
    content: Optional[dict[str, Any]] = Field(default=None, description="Yeni içerik")
    order: Optional[int] = Field(default=None, description="Yeni sıra")


class SectionResponse(BaseModel):
    id: UUID
    report_id: UUID
    title: str
    section_type: str
    content: dict[str, Any]
    order: int
    diagram: Optional[dict[str, Any]] = None


class CreateSectionNoteRequest(BaseModel):
    content: str = Field(..., min_length=1, description="Not metni")


class SectionNoteResponse(BaseModel):
    id: UUID
    section_id: UUID
    author_id: UUID
    content: str
    created_at: datetime


@router.post(
    "/reports/{report_id}/sections",
    response_model=SectionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Rapora manuel yeni bir bölüm ekler",
)
async def create_section(
    report_id: UUID,
    payload: CreateSectionRequest,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user),
):
    rep_repo = ReportRepository(db)
    report = await rep_repo.get_by_id(report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Rapor bulunamadı.")

    sec_repo = SectionRepository(db)
    sec = await sec_repo.create(
        report_id=report_id,
        title=payload.title,
        section_type=payload.content_type,
        content=payload.content,
        order=payload.order,
    )
    return SectionResponse(
        id=sec.id,
        report_id=sec.report_id,
        title=sec.title,
        section_type=sec.section_type,
        content=sec.content,
        order=sec.order,
        diagram=sec.diagram,
    )


@router.patch(
    "/sections/{section_id}",
    response_model=SectionResponse,
    summary="Var olan bir bölümü günceller",
)
async def update_section(
    section_id: UUID,
    payload: UpdateSectionRequest,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user),
):
    sec_repo = SectionRepository(db)
    sec = await sec_repo.get_by_id(section_id)
    if not sec:
        raise HTTPException(status_code=404, detail="Bölüm bulunamadı.")

    updated_sec = await sec_repo.update(
        section_id=section_id,
        title=payload.title,
        content=payload.content,
        order=payload.order,
    )
    if not updated_sec:
        raise HTTPException(status_code=404, detail="Güncellenecek bölüm bulunamadı.")

    return SectionResponse(
        id=updated_sec.id,
        report_id=updated_sec.report_id,
        title=updated_sec.title,
        section_type=updated_sec.section_type,
        content=updated_sec.content,
        order=updated_sec.order,
        diagram=updated_sec.diagram,
    )


@router.delete(
    "/sections/{section_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Bölümü siler",
)
async def delete_section(
    section_id: UUID,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user),
):
    sec_repo = SectionRepository(db)
    sec = await sec_repo.get_by_id(section_id)
    if not sec:
        raise HTTPException(status_code=404, detail="Bölüm bulunamadı.")

    deleted = await sec_repo.delete(section_id)
    if not deleted:
        raise HTTPException(status_code=400, detail="Bölüm silinemedi.")
    return None


@router.post(
    "/sections/{section_id}/notes",
    response_model=SectionNoteResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Bölüme kenar notu ekler",
)
async def create_section_note(
    section_id: UUID,
    payload: CreateSectionNoteRequest,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user),
):
    sec_repo = SectionRepository(db)
    sec = await sec_repo.get_by_id(section_id)
    if not sec:
        raise HTTPException(status_code=404, detail="Bölüm bulunamadı.")

    note_repo = NoteRepository(db)
    note = await note_repo.create_section_note(
        section_id=section_id,
        author_id=current_user.id,
        content=payload.content,
    )
    return SectionNoteResponse(
        id=note.id,
        section_id=note.section_id,
        author_id=note.author_id,
        content=note.content,
        created_at=note.created_at,
    )


@router.get(
    "/sections/{section_id}/notes",
    response_model=list[SectionNoteResponse],
    summary="Bölüme ait kenar notlarını listeler",
)
async def list_section_notes(
    section_id: UUID,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user),
):
    note_repo = NoteRepository(db)
    notes = await note_repo.list_by_section(section_id)
    return [
        SectionNoteResponse(
            id=n.id,
            section_id=n.section_id,
            author_id=n.author_id,
            content=n.content,
            created_at=n.created_at,
        )
        for n in notes
    ]

