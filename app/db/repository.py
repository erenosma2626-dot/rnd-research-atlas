from datetime import datetime, timezone
from typing import Any, Optional
from uuid import UUID, uuid4

from sqlalchemy import desc, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.models import Canvas, CanvasItem, Document, ProjectDocument, Report, Section


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


class CanvasRepository:
    """Canvas (çalışma alanı sayfaları) için veri erişim katmanı."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, project_id: UUID, name: str = "Ana Canvas") -> Canvas:
        """Yeni bir canvas sayfası oluşturur."""
        canvas = Canvas(
            id=uuid4(),
            project_id=project_id,
            name=name,
        )
        self.session.add(canvas)
        await self.session.flush()
        return canvas

    async def get_by_id(self, canvas_id: UUID) -> Optional[Canvas]:
        """Kimliğe göre canvas döner."""
        stmt = select(Canvas).where(Canvas.id == canvas_id, Canvas.deleted_at.is_(None))
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_by_project(self, project_id: UUID) -> list[Canvas]:
        """Projedeki aktif canvas sayfalarını listeler."""
        stmt = (
            select(Canvas)
            .where(Canvas.project_id == project_id, Canvas.deleted_at.is_(None))
            .order_by(Canvas.created_at)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_or_create_default(self, project_id: UUID, name: str = "Ana Canvas") -> Canvas:
        """Proje için mevcut canvas varsa döner, yoksa ilk canvası oluşturur."""
        canvases = await self.list_by_project(project_id)
        if canvases:
            return canvases[0]
        return await self.create(project_id, name=name)

    async def rename(self, canvas_id: UUID, name: str) -> Optional[Canvas]:
        """Canvas adını günceller."""
        stmt = (
            update(Canvas)
            .where(Canvas.id == canvas_id, Canvas.deleted_at.is_(None))
            .values(name=name)
            .returning(Canvas)
        )
        result = await self.session.execute(stmt)
        await self.session.flush()
        return result.scalar_one_or_none()

    async def soft_delete(self, canvas_id: UUID) -> bool:
        """Canvas sayfasını soft delete yapar."""
        now = datetime.now(timezone.utc)
        stmt = update(Canvas).where(Canvas.id == canvas_id).values(deleted_at=now)
        result = await self.session.execute(stmt)
        await self.session.flush()
        return result.rowcount > 0


class CanvasItemRepository:
    """Canvas elemanları (kutucuklar, notlar, bağlantılar) için veri erişim katmanı."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(
        self,
        canvas_id: UUID,
        item_type: str,
        position_x: float = 0.0,
        position_y: float = 0.0,
        ref_id: Optional[UUID] = None,
        content: Optional[dict[str, Any]] = None,
        item_id: Optional[UUID] = None,
    ) -> CanvasItem:
        """Canvas üzerine yeni bir eleman yerleştirir."""
        item = CanvasItem(
            id=item_id or uuid4(),
            canvas_id=canvas_id,
            item_type=item_type,
            ref_id=ref_id,
            position_x=position_x,
            position_y=position_y,
            content=content,
        )
        self.session.add(item)
        await self.session.flush()
        return item

    async def update_position(
        self,
        item_id: UUID,
        position_x: float,
        position_y: float,
    ) -> Optional[CanvasItem]:
        """Canvas elemanının koordinatlarını günceller."""
        stmt = (
            update(CanvasItem)
            .where(CanvasItem.id == item_id)
            .values(position_x=position_x, position_y=position_y)
            .returning(CanvasItem)
        )
        result = await self.session.execute(stmt)
        await self.session.flush()
        return result.scalar_one_or_none()

    async def update_item(
        self,
        item_id: UUID,
        position_x: Optional[float] = None,
        position_y: Optional[float] = None,
        content: Optional[dict[str, Any]] = None,
    ) -> Optional[CanvasItem]:
        """Canvas elemanının pozisyonunu ve/veya içeriğini günceller."""
        values_to_update: dict[str, Any] = {}
        if position_x is not None:
            values_to_update["position_x"] = position_x
        if position_y is not None:
            values_to_update["position_y"] = position_y
        if content is not None:
            values_to_update["content"] = content

        if not values_to_update:
            stmt = select(CanvasItem).where(CanvasItem.id == item_id)
            res = await self.session.execute(stmt)
            return res.scalar_one_or_none()

        stmt = (
            update(CanvasItem)
            .where(CanvasItem.id == item_id)
            .values(**values_to_update)
            .returning(CanvasItem)
        )
        result = await self.session.execute(stmt)
        await self.session.flush()
        return result.scalar_one_or_none()

    async def list_by_canvas(self, canvas_id: UUID) -> list[CanvasItem]:
        """Canvas üzerindeki tüm elemanları listeler."""
        stmt = select(CanvasItem).where(CanvasItem.canvas_id == canvas_id)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def delete(self, item_id: UUID) -> bool:
        """Canvas elemanını siler."""
        from sqlalchemy import delete
        stmt = delete(CanvasItem).where(CanvasItem.id == item_id)
        result = await self.session.execute(stmt)
        await self.session.flush()
        return result.rowcount > 0


class InventoryRepository:
    """Proje doküman envanteri ve canvas kullanım durumu için veri erişim katmanı."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_project_inventory(self, project_id: UUID) -> list[dict[str, Any]]:
        """Projedeki tüm dokümanları ve hangi aktif canvas'larda yer aldıklarını döner."""
        # 1. Projedeki silinmemiş dokümanları al
        doc_stmt = (
            select(Document)
            .join(ProjectDocument, ProjectDocument.document_id == Document.id)
            .where(ProjectDocument.project_id == project_id, Document.deleted_at.is_(None))
            .order_by(Document.uploaded_at.desc())
        )
        doc_res = await self.session.execute(doc_stmt)
        docs = list(doc_res.scalars().all())

        if not docs:
            return []

        doc_ids = [d.id for d in docs]

        # 2. Bu dokümanların yer aldığı aktif canvas'ları bul
        usage_stmt = (
            select(
                CanvasItem.ref_id,
                Canvas.id.label("canvas_id"),
                Canvas.name.label("canvas_name"),
            )
            .join(Canvas, Canvas.id == CanvasItem.canvas_id)
            .where(
                Canvas.project_id == project_id,
                Canvas.deleted_at.is_(None),
                CanvasItem.item_type == "document_box",
                CanvasItem.ref_id.in_(doc_ids),
            )
        )
        usage_res = await self.session.execute(usage_stmt)
        usage_rows = usage_res.all()

        usage_map: dict[UUID, list[dict[str, Any]]] = {d.id: [] for d in docs}
        for ref_id, canvas_id, canvas_name in usage_rows:
            if ref_id and ref_id in usage_map:
                usage_map[ref_id].append({
                    "canvas_id": canvas_id,
                    "canvas_name": canvas_name,
                })

        # 3. Sonuç listesini birleştir
        results: list[dict[str, Any]] = []
        for d in docs:
            results.append({
                "id": d.id,
                "original_filename": d.original_filename,
                "storage_path": d.storage_path,
                "processing_status": d.processing_status,
                "uploaded_at": d.uploaded_at,
                "used_in_canvases": usage_map.get(d.id, []),
            })

        return results
