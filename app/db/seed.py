import logging
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.constants import (
    DEFAULT_PROJECT_ID,
    DEFAULT_PROJECT_NAME,
    DEFAULT_USER_DISPLAY_NAME,
    DEFAULT_USER_EMAIL,
    DEFAULT_USER_ID,
)
from app.db.base import async_session_factory
from app.db.models import Project, User

logger = logging.getLogger("uvicorn.info")


async def seed_default_user_and_project(session: AsyncSession | None = None) -> tuple[User, Project]:
    """Veritabanında varsayılan sabit kullanıcı ve projeyi oluşturur veya varsa döner."""
    close_session_at_end = False
    if session is None:
        session = async_session_factory()
        close_session_at_end = True

    try:
        # 1. Kullanıcı Kontrolü
        user_stmt = select(User).where(
            (User.id == DEFAULT_USER_ID) | (User.email == DEFAULT_USER_EMAIL)
        )
        user_res = await session.execute(user_stmt)
        user = user_res.scalar_one_or_none()

        if not user:
            user = User(
                id=DEFAULT_USER_ID,
                email=DEFAULT_USER_EMAIL,
                display_name=DEFAULT_USER_DISPLAY_NAME,
            )
            session.add(user)
            await session.flush()
            logger.info("Seed: Varsayılan kullanıcı oluşturuldu.")

        # 2. Proje Kontrolü
        proj_stmt = select(Project).where(Project.id == DEFAULT_PROJECT_ID)
        proj_res = await session.execute(proj_stmt)
        project = proj_res.scalar_one_or_none()

        if not project:
            project = Project(
                id=DEFAULT_PROJECT_ID,
                name=DEFAULT_PROJECT_NAME,
                owner_id=user.id,
            )
            session.add(project)
            await session.flush()
            logger.info("Seed: Varsayılan proje oluşturuldu.")

        await session.commit()
        return user, project
    except Exception as e:
        await session.rollback()
        logger.warning(f"Seed işlemi sırasında hata (tablolar henüz hazır olmayabilir): {str(e)}")
        raise e
    finally:
        if close_session_at_end:
            await session.close()
