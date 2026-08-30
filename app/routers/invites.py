from datetime import datetime, timezone
from typing import Any, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.auth.permissions import require_role
from app.db.base import get_async_db
from app.db.models import ProjectMember, User
from app.db.repository import (
    ProjectInviteRepository,
    ProjectMemberRepository,
    ProjectRepository,
)

router = APIRouter(tags=["Project Collaboration & Invites"])


# Pydantic Şemaları
class CreateProjectRequest(BaseModel):
    name: str = Field(..., min_length=1, description="Proje adı")
    description: Optional[str] = Field(default=None, description="Proje açıklaması")


class ProjectSummaryResponse(BaseModel):
    id: UUID
    name: str
    owner_id: UUID
    role: str
    created_at: datetime


class CreateInviteRequest(BaseModel):
    email: str = Field(..., min_length=3, description="Davet edilecek kullanıcının e-posta adresi")
    role: str = Field(default="editor", description="'editor' | 'viewer'")


class InviteResponse(BaseModel):
    invite_token: str
    invite_link: str
    role: str
    invited_email: str
    expires_at: datetime


class InviteInfoResponse(BaseModel):
    project_id: UUID
    project_name: str
    invited_email: str
    role: str
    expires_at: datetime
    status: str


class MemberResponse(BaseModel):
    id: UUID
    user_id: UUID
    email: str
    display_name: str
    role: str
    joined_at: Optional[datetime] = None
    invited_at: datetime


# 1. Kullanıcının Projelerini Listeleme
@router.get(
    "/projects",
    response_model=list[ProjectSummaryResponse],
    summary="Kullanıcının erişebildiği tüm projeleri listele",
)
async def list_user_projects(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
) -> list[ProjectSummaryResponse]:
    """Kullanıcının sahip veya üye olduğu projeleri döner."""
    repo = ProjectRepository(db)
    projects = await repo.list_by_user(current_user.id)
    return [
        ProjectSummaryResponse(
            id=p["id"],
            name=p["name"],
            owner_id=p["owner_id"],
            role=p["role"],
            created_at=p["created_at"],
        )
        for p in projects
    ]


# 2. Yeni Proje Oluşturma
@router.post(
    "/projects",
    response_model=ProjectSummaryResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Yeni bir proje oluştur",
)
async def create_project(
    request: CreateProjectRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
) -> ProjectSummaryResponse:
    """Yeni bir proje oluşturur ve kullanıcıyı 'owner' olarak kaydeder."""
    repo = ProjectRepository(db)
    project = await repo.create(
        owner_id=current_user.id,
        name=request.name,
        description=request.description,
    )
    return ProjectSummaryResponse(
        id=project.id,
        name=project.name,
        owner_id=project.owner_id,
        role="owner",
        created_at=project.created_at,
    )


# 3. Projeye Üye Davet Etme (Owner yetkisi gerekir)
@router.post(
    "/projects/{project_id}/invite",
    response_model=InviteResponse,
    summary="Projeye e-posta ile davet bağlantısı oluştur (Owner)",
)
async def create_project_invite(
    project_id: UUID,
    request: CreateInviteRequest,
    _: ProjectMember = Depends(require_role("owner")),
    db: AsyncSession = Depends(get_async_db),
) -> InviteResponse:
    """Davet token'ı ve bağlantısı üretir."""
    if request.role not in ("editor", "viewer"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Geçersiz rol. Yalnızca 'editor' veya 'viewer' rolüyle davet edilebilir.",
        )

    invite_repo = ProjectInviteRepository(db)
    invite = await invite_repo.create_invite(
        project_id=project_id,
        invited_email=request.email,
        role=request.role,
        expires_in_days=7,
    )

    return InviteResponse(
        invite_token=invite.invite_token,
        invite_link=f"/invite/{invite.invite_token}",
        role=invite.role,
        invited_email=invite.invited_email,
        expires_at=invite.expires_at,
    )


# 4. Davet Bilgisini Görüntüleme (Token doğrulama)
@router.get(
    "/invites/{invite_token}",
    response_model=InviteInfoResponse,
    summary="Davet bağlantısı bilgilerini getir",
)
async def get_invite_info(
    invite_token: str,
    db: AsyncSession = Depends(get_async_db),
) -> InviteInfoResponse:
    """Davet token'ını doğrular ve proje bilgilerini döner."""
    invite_repo = ProjectInviteRepository(db)
    invite = await invite_repo.get_by_token(invite_token)
    if not invite:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Davet bağlantısı bulunamadı veya geçersiz.",
        )

    if invite.status != "pending" or invite.expires_at < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bu davet bağlantısının süresi dolmuş veya daha önce kullanılmış.",
        )

    proj_repo = ProjectRepository(db)
    project = await proj_repo.get_by_id(invite.project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Davet edilen proje bulunamadı.",
        )

    return InviteInfoResponse(
        project_id=project.id,
        project_name=project.name,
        invited_email=invite.invited_email,
        role=invite.role,
        expires_at=invite.expires_at,
        status=invite.status,
    )


# 5. Daveti Kabul Etme
@router.post(
    "/invites/{invite_token}/accept",
    summary="Daveti kabul et ve projeye katıl",
)
async def accept_project_invite(
    invite_token: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
) -> dict[str, Any]:
    """Daveti kabul eder ve kullanıcıyı projeye ekler."""
    invite_repo = ProjectInviteRepository(db)
    invite = await invite_repo.get_by_token(invite_token)
    if not invite:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Davet bulunamadı.",
        )

    if invite.status != "pending" or invite.expires_at < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Davet süresi dolmuş veya zaten kabul edilmiş.",
        )

    # E-posta eşleşme kontrolü (küçük harf toleranslı)
    if current_user.email.lower() != invite.invited_email.lower():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Bu davet '{invite.invited_email}' adresine gönderilmiş. Mevcut hesabınız: '{current_user.email}'.",
        )

    # Üyeliği ekle ve daveti tamamla
    member_repo = ProjectMemberRepository(db)
    await member_repo.add_member(
        project_id=invite.project_id,
        user_id=current_user.id,
        role=invite.role,
    )
    await invite_repo.mark_accepted(invite.id)

    proj_repo = ProjectRepository(db)
    project = await proj_repo.get_by_id(invite.project_id)

    return {
        "status": "accepted",
        "project_id": str(invite.project_id),
        "project_name": project.name if project else "Proje",
        "role": invite.role,
    }


# 6. Proje Üyelerini Listeleme (Viewer+)
@router.get(
    "/projects/{project_id}/members",
    response_model=list[MemberResponse],
    summary="Projedeki üyeleri listele",
)
async def list_project_members(
    project_id: UUID,
    _: ProjectMember = Depends(require_role("viewer")),
    db: AsyncSession = Depends(get_async_db),
) -> list[MemberResponse]:
    """Projenin tüm üyelerini rollerine göre listeler."""
    repo = ProjectMemberRepository(db)
    members = await repo.list_members(project_id)
    return [
        MemberResponse(
            id=m["id"],
            user_id=m["user_id"],
            email=m["email"],
            display_name=m["display_name"],
            role=m["role"],
            joined_at=m["joined_at"],
            invited_at=m["invited_at"],
        )
        for m in members
    ]


# 7. Üyeyi Projeden Çıkarma (Owner)
@router.delete(
    "/projects/{project_id}/members/{user_id}",
    summary="Üyeyi projeden çıkar (Owner)",
)
async def remove_project_member(
    project_id: UUID,
    user_id: UUID,
    current_member: ProjectMember = Depends(require_role("owner")),
    db: AsyncSession = Depends(get_async_db),
) -> dict[str, str]:
    """Üyeyi projeden kaldırır."""
    if current_member.user_id == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Proje sahibi kendi üyeliğini bu şekilde silemez.",
        )

    repo = ProjectMemberRepository(db)
    success = await repo.remove_member(project_id, user_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Üye bulunamadı.",
        )

    return {"status": "removed", "user_id": str(user_id)}
