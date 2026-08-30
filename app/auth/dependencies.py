from typing import Optional
from uuid import UUID

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.supabase_client import verify_jwt
from app.db.base import get_async_db
from datetime import datetime, timezone
from app.db.models import Canvas, Project, ProjectMember, User


async def get_current_user(
    authorization: Optional[str] = Header(None, alias="Authorization"),
    db: AsyncSession = Depends(get_async_db),
) -> User:
    """
    Authorization header'daki Bearer JWT token'ını doğrular.
    Kullanıcı veritabanında yoksa otomatik olarak oluşturur (JIT Provisioning).
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Yetkilendirme başlığı (Authorization: Bearer <token>) eksik.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Geçersiz yetkilendirme formatı. 'Bearer <token>' bekleniyor.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = parts[1]
    claims = verify_jwt(token)
    user_id_str = claims["user_id"]
    email = claims.get("email", f"{user_id_str}@supabase.user")

    try:
        user_uuid = UUID(user_id_str)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Geçersiz kullanıcı kimlik formatı (UUID olmalıdır).",
        )

    # Veritabanında kullanıcıyı ara
    stmt = select(User).where(User.id == user_uuid)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    # Yoksa JIT provisioning ile oluştur
    if not user:
        user = User(
            id=user_uuid,
            email=email,
            display_name=email.split("@")[0],
        )
        db.add(user)
        await db.flush()

        # Kullanıcı için varsayılan bir proje, üyelik ve canvas oluştur
        now = datetime.now(timezone.utc)
        default_project = Project(
            owner_id=user.id,
            name="Varsayılan Proje",
        )
        db.add(default_project)
        await db.flush()

        member = ProjectMember(
            project_id=default_project.id,
            user_id=user.id,
            role="owner",
            invited_by=user.id,
            joined_at=now,
            invited_at=now,
        )
        db.add(member)

        default_canvas = Canvas(
            project_id=default_project.id,
            name="Ana Canvas",
        )
        db.add(default_canvas)
        await db.commit()
        await db.refresh(user)

    return user


async def get_project_or_404(
    project_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
) -> Project:
    """
    Projenin var olduğunu ve mevcut kullanıcının sahibi olduğunu doğrular.
    """
    stmt = select(Project).where(Project.id == project_id, Project.deleted_at.is_(None))
    result = await db.execute(stmt)
    project = result.scalar_one_or_none()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Proje bulunamadı.",
        )

    if project.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bu projeye erişim yetkiniz bulunmuyor.",
        )

    return project
