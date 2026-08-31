import asyncio
import logging
import os
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

from app.db.base import DATABASE_URL
from app.db.repository import DocumentRepository, ReportRepository, SectionRepository
from app.models.diagram import FinalizeReportWithDiagramsResponse
from app.models.document import ParsedDocument
from app.models.figure import ExtractedFigure
from app.models.paper_profile import PaperProfile
from app.models.plan import FigureCandidate, PlanState
from app.models.section_candidate import SectionCandidate
from app.parsers.docling_parser import parse_pdf
from app.services.classifier import classify_paper
from app.services.control_panel import build_final_report
from app.services.diagram_generator import generate_diagrams_batch
from app.services.figure_extractor import extract_figures
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
    """1. Aşama: Doküman ayrıştırma, figür çıkarma, sınıflandırma ve indeksleme."""
    doc_uuid = UUID(document_id)
    worker_engine, worker_session_factory = _get_worker_db_session()

    try:
        async with worker_session_factory() as session:
            doc_repo = DocumentRepository(session)

            try:
                # 1. Aşama: parsing (Docling PDF ayrıştırma & Figür çıkarma)
                await doc_repo.update_status(doc_uuid, "parsing")
                await session.commit()
                parsed_doc = parse_pdf(file_path)

                # Figürleri / şemaları ayıkla
                figures = []
                try:
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
                active_section_schemas = route_sections(profile)

                # Aday Bölümleri ve Figürleri hazırla
                from app.services.control_panel import build_plan_candidates
                from app.storage.object_store import get_presigned_url

                candidate_sections = build_plan_candidates(active_section_schemas)

                candidate_figures: list[FigureCandidate] = []
                for idx, f in enumerate(figures):
                    try:
                        img_url = get_presigned_url(f.image_storage_path, expires_seconds=86400)
                    except Exception:
                        img_url = f.image_storage_path
                    candidate_figures.append(
                        FigureCandidate(
                            figure_id=f.figure_id,
                            caption=f.caption,
                            image_url=img_url,
                            included=True,
                            order=idx + 1,
                        )
                    )

                # Plan durumunu kaydet
                plan_state = PlanState(
                    document_id=document_id,
                    active_sections=candidate_sections,
                    extracted_figures=candidate_figures,
                    paper_profile=profile.model_dump(),
                    parsed_doc=parsed_doc.model_dump(),
                )
                await doc_repo.update_plan_state(doc_uuid, plan_state.model_dump())

                # Durumu awaiting_plan_approval yap
                await doc_repo.update_status(doc_uuid, "awaiting_plan_approval")
                await session.commit()
                logger.info(f"Doküman ayrıştırma tamamlandı, plan onayı bekleniyor: {document_id}")

            except Exception as e:
                await session.rollback()
                err_msg = str(e)
                logger.error(f"Doküman işlenirken hata meydana geldi ({document_id}): {err_msg}")
                await doc_repo.update_status(doc_uuid, "failed", error_message=err_msg)
                await session.commit()
                raise e
    finally:
        await worker_engine.dispose()


async def _async_generate_final_report(document_id: str, approved_plan_dict: dict | None = None) -> None:
    """2. Aşama: Kullanıcının onayladığı plana göre slot doldurma, diyagram ve rapor üretimi."""
    doc_uuid = UUID(document_id)
    worker_engine, worker_session_factory = _get_worker_db_session()

    try:
        async with worker_session_factory() as session:
            doc_repo = DocumentRepository(session)
            report_repo = ReportRepository(session)
            section_repo = SectionRepository(session)

            try:
                await doc_repo.update_status(doc_uuid, "generating_report")
                await session.commit()

                doc = await doc_repo.get_by_id(doc_uuid)
                if not doc:
                    raise ValueError(f"Doküman bulunamadı: {document_id}")

                plan_data = approved_plan_dict or doc.plan_state or {}
                plan_state = PlanState(**plan_data) if plan_data else None

                # Profil ve section routing belirle
                raw_profile = plan_state.paper_profile if plan_state and plan_state.paper_profile else {}
                profile = PaperProfile(**raw_profile) if raw_profile else PaperProfile(domain="generic", sub_domain=None)

                # Dahil edilecek bölümleri filtrele
                included_section_ids = (
                    [s.section_id for s in plan_state.active_sections if s.included]
                    if plan_state
                    else []
                )

                all_schemas = route_sections(profile)
                if included_section_ids:
                    active_schemas = [s for s in all_schemas if s.group_id in included_section_ids]
                    # Kullanıcı sıralamasına göre sırala
                    order_map = {s.section_id: s.order for s in plan_state.active_sections}
                    active_schemas.sort(key=lambda s: order_map.get(s.group_id, 999))
                else:
                    active_schemas = all_schemas

                # Görselleri hazırla
                included_figures = []
                if plan_state and plan_state.extracted_figures:
                    included_figures = [
                        ExtractedFigure(
                            figure_id=f.figure_id,
                            page=getattr(f, "order", 1),
                            caption=f.caption,
                            image_storage_path=f.image_url,
                            image_url=f.image_url,
                        )
                        for f in plan_state.extracted_figures
                        if f.included
                    ]

                # Parsed doc snapshot'ından geri yükle
                parsed_doc_data = plan_state.parsed_doc if plan_state and plan_state.parsed_doc else None
                parsed_doc = ParsedDocument(**parsed_doc_data) if parsed_doc_data else None

                # Slot Doldurma
                filled_sections = fill_all_sections(
                    document_id=document_id,
                    active_groups=active_schemas,
                    parsed_doc=parsed_doc,
                    paper_profile=profile,
                )

                # Figür galerisi bölümünü ekle / güncelle
                if included_figures and not any(s.content_type == "image_gallery" for s in filled_sections):
                    from app.services.slot_filler import fill_paper_figures_section
                    gallery_sec = fill_paper_figures_section(included_figures, document_id)
                    if gallery_sec:
                        filled_sections.append(gallery_sec)

                # Diyagram Üretimi (diagram_included=True olanlar için)
                diagram_map = {}
                if plan_state:
                    diag_req_ids = {s.section_id for s in plan_state.active_sections if s.diagram_included}
                    for sec in filled_sections:
                        sec.diagram_requested = bool(sec.group_id in diag_req_ids)
                    
                    secs_to_generate = [s for s in filled_sections if s.diagram_requested]
                    generated_diagrams = generate_diagrams_batch(secs_to_generate)
                    diagram_map = {d.section_id: d.model_dump() for d in generated_diagrams}

                # DB Rapor Kaydı
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
                        "diagram": diagram_map.get(sec.group_id),
                    }
                    for idx, sec in enumerate(filled_sections)
                ]

                await section_repo.create_many(
                    report_id=report_record.id,
                    sections_data=sections_data,
                )

                await doc_repo.update_status(doc_uuid, "done")
                await session.commit()
                logger.info(f"Nihai rapor başarıyla üretildi: {document_id}")

            except Exception as e:
                await session.rollback()
                err_msg = str(e)
                logger.error(f"Rapor üretilirken hata ({document_id}): {err_msg}")
                await doc_repo.update_status(doc_uuid, "failed", error_message=err_msg)
                await session.commit()
                raise e
    finally:
        await worker_engine.dispose()


@celery_app.task(bind=True, max_retries=2)
def process_document_task(self, document_id: str, file_path: str, project_id: str) -> None:
    """1. Aşama Celery görevi: Ayrıştırma, figür ve sınıflandırma."""
    logger.info(f"Doküman ayrıştırma görevi başladı: doc={document_id}")
    try:
        asyncio.run(_async_process_document(document_id, file_path, project_id))
    except Exception as exc:
        raise exc
    finally:
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except OSError:
                pass


@celery_app.task(bind=True, max_retries=2)
def generate_final_report_task(self, document_id: str, plan_dict: dict | None = None) -> None:
    """2. Aşama Celery görevi: Nihai rapor slot doldurma ve diyagram üretimi."""
    logger.info(f"Nihai rapor üretim görevi başladı: doc={document_id}")
    try:
        asyncio.run(_async_generate_final_report(document_id, plan_dict))
    except Exception as exc:
        raise exc
