import asyncio
from datetime import datetime, timezone
from sqlalchemy import select
from app.db.base import async_session_factory
from app.db.models import Project, ProjectMember


async def backfill_project_owners():
    """Mevcut tüm projeler için owner_id'ye karşılık gelen bir ProjectMember(role='owner') kaydı oluşturur."""
    async with async_session_factory() as session:
        # 1. Tüm projeleri çek
        stmt = select(Project)
        res = await session.execute(stmt)
        projects = res.scalars().all()

        added_count = 0
        for p in projects:
            # 2. Bu proje ve owner için üyelik var mı kontrol et
            member_stmt = select(ProjectMember).where(
                ProjectMember.project_id == p.id,
                ProjectMember.user_id == p.owner_id,
            )
            member_res = await session.execute(member_stmt)
            existing_member = member_res.scalar_one_or_none()

            if not existing_member:
                new_member = ProjectMember(
                    project_id=p.id,
                    user_id=p.owner_id,
                    role="owner",
                    invited_by=p.owner_id,
                    joined_at=p.created_at or datetime.now(timezone.utc),
                    invited_at=p.created_at or datetime.now(timezone.utc),
                )
                session.add(new_member)
                added_count += 1

        if added_count > 0:
            await session.commit()
            print(f"Başarıyla {added_count} adet proje sahibi ProjectMember tablosuna eklendi.")
        else:
            print("Tüm projelerin owner üyelik kayıtları zaten mevcut.")


if __name__ == "__main__":
    asyncio.run(backfill_project_owners())
