import os
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Tüm SQLAlchemy ORM modelleri için temel sınıf."""
    pass


def get_database_url() -> str:
    """Ortam değişkenlerinden asenkron veritabanı bağlantı dizesini alır."""
    url = os.getenv(
        "DATABASE_URL",
        "postgresql+asyncpg://postgres:devpassword@localhost:5432/rnd_paper_canvas",
    )
    # Supabase veya standart postgres:// formatı gelirse postgresql+asyncpg:// olarak düzelt
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql+asyncpg://", 1)
    elif url.startswith("postgresql://") and not url.startswith("postgresql+asyncpg://"):
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
    return url


DATABASE_URL = get_database_url()

# Asenkron SQLAlchemy Motoru
engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    future=True,
    pool_pre_ping=True,
)

# Asenkron Session Üreticisi
async_session_factory = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def get_async_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI endpoint'leri için asenkron veritabanı oturumu (session) dependency'si."""
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
