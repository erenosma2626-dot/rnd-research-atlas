import asyncio
import logging
import os
from uuid import UUID

from app.db.base import async_session_factory
from app.db.repository import DocumentRepository, ReportRepository, SectionRepository
from app.parsers.docling_parser import parse_pdf
from app.services.classifier import classify_paper
from app.services.formula_extractor import extract_all_formulas
from app.services.section_router import route_sections
from app.services.slot_filler import fill_all_sections
from app.services.vector_store import index_document
from app.worker.celery_app import celery_app

logger = logging.getLogger("celery.task")


async def _async_process_document(document_id: str, file_path: str, project_id: str) -> None:
    """Asenkron veritabanı oturumuyla tüm pipeline adımlarını çalıştırır."""
    doc_uuid = UUID(document_id)

    async with async_session_factory() as session:
        doc_repo = DocumentRepository(session)
        report_repo = ReportRepository(session)
        section_repo = SectionRepository(session)

        # 1. Durumu "processing" yap
        await doc_repo.update_status(doc_uuid, "processing")
        await session.commit()

        try:
            # 2. Step 1: Docling Parsing
            parsed_doc = parse_pdf(file_path)

            # 3. Step 8: Formula Extraction
            try:
                extracted_formulas = extract_all_formulas(parsed_doc.formulas)
            except Exception as e:
                logger.warning(f"Formül çıkarma atlandı: {e}")
                extracted_formulas = []

            # 4. Step 2: PaperProfile Classification
            profile = classify_paper(parsed_doc)

            # 5. Step 3: ChromaDB Indexing & Section Routing
            index_document(document_id, parsed_doc)
            active_sections = route_sections(profile)

            # 6. Step 4: Slot Filling
            filled_sections = fill_all_sections(
                document_id=document_id,
                active_groups=active_sections,
                parsed_doc=parsed_doc,
                extracted_formulas=extracted_formulas,
                paper_profile=profile,
            )

            # 7. Step 11: DB Kayıtları (Report + Sections)
            report_record = await report_repo.create(
                document_id=doc_uuid,
                paper_profile=profile.model_dump(),
                version=1,
            )
            sections_data = [
                {
                    "content_type": sec.content_type,
                    "title": sec.title,
                    "content": sec.content,
                    "order": idx + 1,
                    "diagram": None,
                }
                for idx, sec in enumerate(filled_sections)
            ]
            await section_repo.create_many(
                report_id=report_record.id,
                sections_data=sections_data,
            )

            # 8. Durumu "done" olarak güncelle
            await doc_repo.update_status(doc_uuid, "done")
            await session.commit()
            logger.info(f"Doküman başarıyla işlendi ve kaydedildi: {document_id}")

        except Exception as e:
            await session.rollback()
            err_msg = str(e)
            logger.error(f"Doküman işlenirken hata meydana geldi ({document_id}): {err_msg}")
            await doc_repo.update_status(doc_uuid, "failed", error_message=err_msg)
            await session.commit()
            raise e


@celery_app.task(bind=True, max_retries=2)
def process_document_task(self, document_id: str, file_path: str, project_id: str) -> None:
    """Arka planda doküman analiz pipeline'ını yürüten Celery görevi."""
    logger.info(f"Celery görevi başladı: doc={document_id}, path={file_path}")
    try:
        asyncio.run(_async_process_document(document_id, file_path, project_id))
    except Exception as exc:
        err_str = str(exc).lower()
        is_transient = "rate limit" in err_str or "connection" in err_str or "timeout" in err_str
        if is_transient and self.request.retries < self.max_retries:
            logger.warning(f"Geçici hata, yeniden deneniyor (deneme {self.request.retries + 1}): {exc}")
            raise self.retry(exc=exc, countdown=10)
        raise exc
    finally:
        # Geçici PDF dosyasını temizle
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except OSError:
                pass
