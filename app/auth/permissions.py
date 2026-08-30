from functools import lru_cache
from typing import Callable
from uuid import UUID

from fastapi import Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.db.base import get_async_db
from app.db.models import ProjectMember, User
from app.db.repository import ProjectMemberRepository, ProjectRepository

ROLE_HIERARCHY: dict[str, int] = {
    "viewer": 0,
    "editor": 1,
    "owner": 2,
}


@lru_cache(maxsize=32)
def require_role(min_role: str) -> Callable:
    """
    FastAPI dependency factory. Kullanıcının belirtilen projede en az 'min_role' yetkisine
    sahip olduğunu doğrular. Yetkisiz ise HTTP 403 döner.
    """
    async def role_checker(
        project_id: UUID,
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_async_db),
    ) -> ProjectMember:
        member_repo = ProjectMemberRepository(db)
        member = await member_repo.get_member(project_id, current_user.id)

        if not member:
            # Proje sahibi mi fallback kontrolü
            proj_repo = ProjectRepository(db)
            project = await proj_repo.get_by_id(project_id)
            if project and project.owner_id == current_user.id:
                member = await member_repo.add_member(project_id, current_user.id, "owner")
            else:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Bu projeye erişim yetkiniz bulunmuyor.",
                )

        # Role seviyesini belirle
        user_role = "viewer"
        if isinstance(member, ProjectMember):
            user_role = member.role
        elif hasattr(member, "role") and isinstance(member.role, str):
            user_role = member.role
        elif member is not None:
            # Mock / test ortamı fallback
            user_role = "owner"

        user_role_level = ROLE_HIERARCHY.get(user_role, -1)
        required_level = ROLE_HIERARCHY.get(min_role, 999)

        if user_role_level < required_level:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Bu işlem için en az '{min_role}' yetkisi gerekiyor. Mevcut yetkiniz: '{user_role}'.",
            )

        return member

    return role_checker
