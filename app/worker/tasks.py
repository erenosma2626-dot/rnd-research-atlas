import asyncio
import logging
import os
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

from app.db.base import DATABASE_URL
from app.db.repository import DocumentRepository, ReportRepository, SectionRepository
from app.parsers.docling_parser import parse_pdf
from app.services.classifier import classify_paper
from app.services.formula_extractor import extract_all_formulas
from app.services.section_router import route_sections
from app.services.slot_filler import fill_all_sections
from app.services.vector_store import index_document
from app.worker.celery_app import celery_app

logger = logging.getLogger("celery.task")


def _get_worker_db_session():
    """Celery görevleri için her event loop'a özel NullPool motoru ve session üretir."""
    worker_engine = create_async_engine(
        DATABASE_URL,
        poolclass=NullPool,
        echo=False,
        future=True,
    )
    worker_session_factory = async_sessionmaker(
        bind=worker_engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autocommit=False,
        autoflush=False,
    )
    return worker_engine, worker_session_factory


async def _async_process_document(document_id: str, file_path: str, project_id: str) -> None:
    """Asenkron veritabanı oturumuyla tüm pipeline adımlarını çalıştırır."""
    doc_uuid = UUID(document_id)
    worker_engine, worker_session_factory = _get_worker_db_session()

    try:
        async with worker_session_factory() as session:
            doc_repo = DocumentRepository(session)
            report_repo = ReportRepository(session)
            section_repo = SectionRepository(session)

            try:
                # 1. Aşama: parsing (Docling PDF ayrıştırma & Figür çıkarma)
                await doc_repo.update_status(doc_uuid, "parsing")
                await session.commit()
                parsed_doc = parse_pdf(file_path)

                # Figürleri / şemaları ayıkla
                try:
                    from app.services.figure_extractor import extract_figures
                    figures = extract_figures(file_path, document_id)
                    parsed_doc.figures = figures
                except Exception as fig_err:
                    logger.warning(f"Figür çıkarma hatası: {fig_err}")
                    parsed_doc.figures = []

                # 2. Aşama: extracting_formulas (Formül çıkarma)
                await doc_repo.update_status(doc_uuid, "extracting_formulas")
                await session.commit()
                try:
                    extracted_formulas = extract_all_formulas(parsed_doc.formulas)
                except Exception as e:
                    logger.warning(f"Formül çıkarma atlandı: {e}")
                    extracted_formulas = []

                # 3. Aşama: classifying (PaperProfile sınıflandırma)
                await doc_repo.update_status(doc_uuid, "classifying")
                await session.commit()
                profile = classify_paper(parsed_doc)
                if len(parsed_doc.figures) > 0:
                    profile.has_extractable_figures = True

                # 4. Aşama: indexing (ChromaDB vektör indeksleme & rota belirleme)
                await doc_repo.update_status(doc_uuid, "indexing")
                await session.commit()
                index_document(document_id, parsed_doc)
                active_sections = route_sections(profile)

                # 5. Aşama: generating_report (Slot doldurma & rapor oluşturma)
                await doc_repo.update_status(doc_uuid, "generating_report")
                await session.commit()
                filled_sections = fill_all_sections(
                    document_id=document_id,
                    active_groups=active_sections,
                    parsed_doc=parsed_doc,
                    extracted_formulas=extracted_formulas,
                    paper_profile=profile,
                )

                # DB Kayıtları (Report + Sections)
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

                # 6. Tamamlandı: done
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
    finally:
        await worker_engine.dispose()


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
