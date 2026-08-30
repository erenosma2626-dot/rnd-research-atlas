from datetime import datetime, timezone
from typing import Any, Optional
from uuid import UUID, uuid4

from sqlalchemy import desc, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.models import Document, ProjectDocument, Report, Section


class DocumentRepository:
    """Doküman tablosu için veri erişim katmanı."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(
        self,
        original_filename: str,
        storage_path: str,
        document_id: Optional[UUID] = None,
        processing_status: str = "pending",
        error_message: Optional[str] = None,
    ) -> Document:
        """Yeni bir doküman kaydı oluşturur."""
        doc = Document(
            id=document_id or uuid4(),
            original_filename=original_filename,
            storage_path=storage_path,
            processing_status=processing_status,
            error_message=error_message,
        )
        self.session.add(doc)
        await self.session.flush()
        return doc

    async def add_to_project(
        self,
        project_id: UUID,
        document_id: UUID,
        added_by: UUID,
    ) -> ProjectDocument:
        """Dokümanı bir projeye bağlar."""
        proj_doc = ProjectDocument(
            project_id=project_id,
            document_id=document_id,
            added_by=added_by,
        )
        self.session.add(proj_doc)
        await self.session.flush()
        return proj_doc

    async def get_by_id(self, document_id: UUID) -> Optional[Document]:
        """Kimliğe göre dokümanı döner (silinmiş olsa dahi)."""
        stmt = select(Document).where(Document.id == document_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_by_project(
        self,
        project_id: UUID,
        include_deleted: bool = False,
    ) -> list[Document]:
        """Belirli bir projeye bağlı dokümanları listeler."""
        stmt = (
            select(Document)
            .join(ProjectDocument, ProjectDocument.document_id == Document.id)
            .where(ProjectDocument.project_id == project_id)
            .order_by(desc(Document.uploaded_at))
        )
        if not include_deleted:
            stmt = stmt.where(Document.deleted_at.is_(None))

        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def soft_delete(self, document_id: UUID) -> bool:
        """Dokümanı soft delete yapar (deleted_at damgalar)."""
        now = datetime.now(timezone.utc)
        stmt = (
            update(Document)
            .where(Document.id == document_id)
            .values(deleted_at=now)
        )
        result = await self.session.execute(stmt)
        await self.session.flush()
        return result.rowcount > 0

    async def update_status(
        self,
        document_id: UUID,
        status: str,
        error_message: Optional[str] = None,
    ) -> None:
        """Dokümanın işlem durumunu (pending, processing, done, failed) ve varsa hata mesajını günceller."""
        values = {"processing_status": status}
        if error_message is not None:
            values["error_message"] = error_message
        stmt = (
            update(Document)
            .where(Document.id == document_id)
            .values(**values)
        )
        await self.session.execute(stmt)
        await self.session.flush()


class ReportRepository:
    """Rapor tablosu için veri erişim katmanı."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(
        self,
        document_id: UUID,
        paper_profile: dict[str, Any],
        version: int = 1,
        report_id: Optional[UUID] = None,
    ) -> Report:
        """Yeni bir rapor kaydı oluşturur."""
        report = Report(
            id=report_id or uuid4(),
            document_id=document_id,
            version=version,
            paper_profile=paper_profile,
        )
        self.session.add(report)
        await self.session.flush()
        return report

    async def get_latest_by_document(self, document_id: UUID) -> Optional[Report]:
        """Dokümanın en güncel raporunu (ilişkili bölümleriyle birlikte) döner."""
        stmt = (
            select(Report)
            .where(Report.document_id == document_id)
            .order_by(desc(Report.version), desc(Report.generated_at))
            .options(selectinload(Report.sections))
            .limit(1)
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()


class SectionRepository:
    """Rapor bölümleri için veri erişim katmanı."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def create_many(
        self,
        report_id: UUID,
        sections_data: list[dict[str, Any]],
    ) -> list[Section]:
        """Bir rapora ait çoklu bölüm kayıtlarını toplu olarak ekler."""
        created_sections: list[Section] = []
        for s_data in sections_data:
            sec = Section(
                id=uuid4(),
                report_id=report_id,
                section_type=s_data.get("content_type", "prose"),
                title=s_data.get("title", ""),
                content=s_data.get("content", {}),
                order=s_data.get("order", 1),
                diagram=s_data.get("diagram", None),
            )
            self.session.add(sec)
            created_sections.append(sec)
        await self.session.flush()
        return created_sections

    async def get_by_report(self, report_id: UUID) -> list[Section]:
        """Rapor kimliğine göre sıralanmış bölümleri döner."""
        stmt = (
            select(Section)
            .where(Section.report_id == report_id)
            .order_by(Section.order)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())
