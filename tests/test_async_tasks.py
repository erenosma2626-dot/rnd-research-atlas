import asyncio
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import UUID, uuid4

from app.models.document import ParsedDocument, Section as DocSection
from app.models.paper_profile import PaperProfile
from app.models.report_section import FilledSection
from app.worker.tasks import _async_process_document, process_document_task


def test_async_process_document_success():
    """_async_process_document fonksiyonunun başarılı akışını test eder."""
    doc_id = str(uuid4())
    project_id = str(uuid4())

    mock_parsed_doc = ParsedDocument(
        sections=[
            DocSection(
                title="1. Introduction",
                level=1,
                page_start=1,
                page_end=1,
                text="Introduction text",
            )
        ],
        formulas=[],
        raw_markdown="# 1. Introduction\n\nIntroduction text",
        total_pages=1,
    )

    mock_profile = PaperProfile(
        has_theorem_proof=False,
        has_heavy_notation=False,
        has_algorithm_pseudocode=False,
        has_complexity_analysis=False,
        has_optimization_formulation=False,
        has_ml_experiment=True,
        has_ablation_study=False,
        has_dataset=True,
        has_preprocessing_pipeline=False,
        has_hyperparameter_tuning=False,
        has_baseline_comparison=False,
        has_evaluation_metrics=True,
        has_system_architecture=False,
        has_survey_structure=False,
        has_case_study=False,
        has_limitations_section=False,
        has_future_work=False,
        primary_domain="NLP",
        confidence=0.9,
    )

    mock_filled_section = FilledSection(
        group_id="core_summary",
        title="Özet ve Katkı",
        content_type="prose",
        content={"text": "Özet içeriği."},
        sources=[],
    )

    with patch("app.worker.tasks.parse_pdf", return_value=mock_parsed_doc), \
         patch("app.worker.tasks.classify_paper", return_value=mock_profile), \
         patch("app.worker.tasks.index_document"), \
         patch("app.worker.tasks.route_sections", return_value=[]), \
         patch("app.worker.tasks.fill_all_sections", return_value=[mock_filled_section]), \
         patch("app.worker.tasks._get_worker_db_session") as mock_get_db:

        mock_session = AsyncMock()
        mock_factory = MagicMock()
        mock_factory.return_value.__aenter__.return_value = mock_session
        mock_engine = AsyncMock()
        mock_get_db.return_value = (mock_engine, mock_factory)

        with patch("app.worker.tasks.DocumentRepository") as mock_doc_repo_cls, \
             patch("app.worker.tasks.ReportRepository") as mock_rep_repo_cls, \
             patch("app.worker.tasks.SectionRepository") as mock_sec_repo_cls:

            mock_doc_repo = AsyncMock()
            mock_rep_repo = AsyncMock()
            mock_sec_repo = AsyncMock()

            mock_doc_repo_cls.return_value = mock_doc_repo
            mock_rep_repo_cls.return_value = mock_rep_repo
            mock_sec_repo_cls.return_value = mock_sec_repo

            mock_report_rec = MagicMock()
            mock_report_rec.id = uuid4()
            mock_rep_repo.create.return_value = mock_report_rec

            asyncio.run(_async_process_document(doc_id, "/tmp/sample.pdf", project_id))

            mock_doc_repo.update_status.assert_any_call(UUID(doc_id), "parsing")
            mock_doc_repo.update_status.assert_any_call(UUID(doc_id), "done")
            mock_sec_repo.create_many.assert_called_once()


def test_process_document_task_celery():
    """process_document_task Celery görevinin senkron sarmalayıcısını test eder."""
    doc_id = str(uuid4())
    with patch("app.worker.tasks._async_process_document") as mock_async_proc:
        mock_async_proc.return_value = None
        process_document_task(doc_id, "/tmp/non_existent.pdf", "proj-1")
        mock_async_proc.assert_called_once_with(doc_id, "/tmp/non_existent.pdf", "proj-1")
