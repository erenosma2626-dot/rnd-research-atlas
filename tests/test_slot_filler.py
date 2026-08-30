import io
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient
import pytest

from app.main import app
from app.models.document import Formula, ParsedDocument, Section
from app.models.paper_profile import PaperProfile
from app.models.report_section import (
    FilledSection,
    GenerateReportRequest,
    SourceReference,
)
from app.models.routing import ActiveSectionGroup
from app.services.slot_filler import (
    ListContent,
    ProseContent,
    TableContent,
    fill_all_sections,
    fill_section,
    get_response_model_for_type,
)

client = TestClient(app)


@pytest.fixture
def sample_parsed_document() -> ParsedDocument:
    return ParsedDocument(
        sections=[
            Section(
                title="Abstract",
                level=1,
                text="This paper introduces a fast transformer architecture.",
                page_start=1,
                page_end=1,
            ),
            Section(
                title="Methodology",
                level=1,
                text="Step 1: Tokenization. Step 2: Linear Attention.",
                page_start=2,
                page_end=3,
            ),
        ],
        formulas=[Formula(raw_text="A = QK^T", page=2)],
        raw_markdown="# Abstract\n\n# Methodology",
        total_pages=3,
    )


@pytest.fixture
def sample_active_sections() -> list[ActiveSectionGroup]:
    return [
        ActiveSectionGroup(
            group_id="core_summary",
            title="Özet ve Katkı",
            matched_flags=[],
        ),
        ActiveSectionGroup(
            group_id="method_steps",
            title="Yöntem",
            matched_flags=[],
        ),
        ActiveSectionGroup(
            group_id="ml_experiment_table",
            title="Veri & Yöntem (ML)",
            matched_flags=["has_ml_experiment"],
        ),
    ]


def test_response_models_for_content_type():
    """get_response_model_for_type doğru modelleri dönmeli."""
    assert get_response_model_for_type("table") == TableContent
    assert get_response_model_for_type("list") == ListContent
    assert get_response_model_for_type("prose") == ProseContent


def test_content_models_instantiation():
    """ProseContent, TableContent ve ListContent oluşturma testi."""
    prose = ProseContent(text="Detailed summary of the paper.")
    assert prose.text == "Detailed summary of the paper."

    table = TableContent(
        columns=["Dataset", "Model", "Accuracy"],
        rows=[["ImageNet", "ResNet-50", "76.1%"]],
    )
    assert len(table.columns) == 3
    assert len(table.rows) == 1

    lst = ListContent(items=["Step 1: Setup", "Step 2: Train"])
    assert len(lst.items) == 2


@patch("app.services.slot_filler.get_instructor_client")
@patch("app.services.slot_filler.query_document")
def test_fill_section_prose_success(mock_query, mock_get_client, sample_parsed_document):
    """Prose tipindeki bir section'ın başarıyla doldurulması."""
    mock_query.return_value = [
        {
            "content": "This paper presents a fast transformer architecture.",
            "metadata": {"page_start": 1, "section_title": "Abstract"},
            "distance": 0.1,
        }
    ]
    mock_client = MagicMock()
    mock_client.chat.completions.create.return_value = ProseContent(
        text="Bu makale hızlı bir transformer mimarisi önermektedir."
    )
    mock_get_client.return_value = (mock_client, "llama-3.3-70b-versatile")

    group = ActiveSectionGroup(group_id="core_summary", title="Özet ve Katkı", matched_flags=[])
    filled = fill_section("doc-1", group, sample_parsed_document)

    assert filled.group_id == "core_summary"
    assert filled.content_type == "prose"
    assert "hızlı bir transformer" in filled.content["text"]
    assert len(filled.sources) >= 1
    assert filled.sources[0].page == 1


@patch("app.services.slot_filler.get_instructor_client")
@patch("app.services.slot_filler.query_document")
def test_fill_section_table_success(mock_query, mock_get_client, sample_parsed_document):
    """Table tipindeki bir section'ın başarıyla doldurulması."""
    mock_query.return_value = []
    mock_client = MagicMock()
    mock_client.chat.completions.create.return_value = TableContent(
        columns=["Dataset", "Model", "Result"],
        rows=[["CIFAR-10", "OurModel", "95.4%"]],
    )
    mock_get_client.return_value = (mock_client, "llama-3.3-70b-versatile")

    group = ActiveSectionGroup(group_id="ml_experiment_table", title="Veri & Yöntem (ML)", matched_flags=[])
    filled = fill_section("doc-1", group, sample_parsed_document)

    assert filled.group_id == "ml_experiment_table"
    assert filled.content_type == "table"
    assert filled.content["columns"] == ["Dataset", "Model", "Result"]
    assert filled.content["rows"][0][1] == "OurModel"


@patch("app.services.slot_filler.get_instructor_client")
@patch("app.services.slot_filler.query_document")
def test_fill_section_error_isolation(mock_query, mock_get_client, sample_parsed_document):
    """LLM hatası durumunda uygulamanın çökmediğini ve content_type='error' döndüğünü test eder."""
    mock_query.return_value = []
    mock_client = MagicMock()
    mock_client.chat.completions.create.side_effect = Exception("API rate limit error")
    mock_get_client.return_value = (mock_client, "llama-3.3-70b-versatile")

    group = ActiveSectionGroup(group_id="core_summary", title="Özet ve Katkı", matched_flags=[])
    filled = fill_section("doc-1", group, sample_parsed_document)

    assert filled.group_id == "core_summary"
    assert filled.content_type == "error"
    assert "error" in filled.content
    assert "rate limit" in filled.content["error"]


@patch("app.services.slot_filler.fill_section")
def test_fill_all_sections(mock_fill, sample_active_sections, sample_parsed_document):
    """fill_all_sections'ın tüm aktif grupları çağırdığını test eder."""
    mock_fill.return_value = FilledSection(
        group_id="test",
        title="Test Title",
        content_type="prose",
        content={"text": "Test text"},
        sources=[],
    )
    results = fill_all_sections("doc-1", sample_active_sections, sample_parsed_document)
    assert len(results) == len(sample_active_sections)
    assert mock_fill.call_count == len(sample_active_sections)


@patch("app.routers.report.fill_all_sections")
def test_generate_report_endpoint(mock_fill, sample_active_sections, sample_parsed_document):
    """POST /generate-report endpoint'ini test eder."""
    mock_fill.return_value = [
        FilledSection(
            group_id="core_summary",
            title="Özet ve Katkı",
            content_type="prose",
            content={"text": "Makale özeti."},
            sources=[SourceReference(page=1, section_title="Abstract")],
        )
    ]

    response = client.post(
        "/generate-report",
        json={
            "document_id": "doc-test-123",
            "active_sections": [s.model_dump() for s in sample_active_sections],
            "parsed_document": sample_parsed_document.model_dump(),
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["document_id"] == "doc-test-123"
    assert len(data["sections"]) == 1
    assert data["sections"][0]["group_id"] == "core_summary"


@patch("app.routers.report.fill_all_sections")
@patch("app.routers.report.index_document")
@patch("app.routers.report.route_sections")
@patch("app.routers.report.classify_paper")
@patch("app.routers.report.parse_pdf")
def test_full_pipeline_endpoint(
    mock_parse,
    mock_classify,
    mock_route,
    mock_index,
    mock_fill,
    sample_parsed_document,
    sample_active_sections,
):
    """POST /full-pipeline uçtan uca boru hattını test eder."""
    mock_parse.return_value = sample_parsed_document
    mock_classify.return_value = PaperProfile(
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
    mock_route.return_value = sample_active_sections
    mock_index.return_value = 2
    mock_fill.return_value = [
        FilledSection(
            group_id="core_summary",
            title="Özet ve Katkı",
            content_type="prose",
            content={"text": "Makale özeti."},
            sources=[],
        )
    ]

    files = {"file": ("paper.pdf", io.BytesIO(b"%PDF-1.4 dummy"), "application/pdf")}
    response = client.post("/full-pipeline", files=files)

    assert response.status_code == 200
    data = response.json()
    assert "document_id" in data
    assert "paper_profile" in data
    assert data["paper_profile"]["primary_domain"] == "NLP"
    assert len(data["sections"]) == 1
    assert data["sections"][0]["group_id"] == "core_summary"
