import io
from unittest.mock import MagicMock, patch
import chromadb
from fastapi.testclient import TestClient
import pytest

from app.main import app
from app.models.document import Formula, ParsedDocument, Section
from app.models.paper_profile import PaperProfile
from app.services.section_router import route_sections
from app.services.vector_store import (
    chunk_section,
    index_document,
    query_document,
)

client = TestClient(app)


@pytest.fixture
def minimal_paper_profile() -> PaperProfile:
    return PaperProfile(
        has_theorem_proof=False,
        has_heavy_notation=False,
        has_algorithm_pseudocode=False,
        has_complexity_analysis=False,
        has_optimization_formulation=False,
        has_ml_experiment=False,
        has_ablation_study=False,
        has_dataset=False,
        has_preprocessing_pipeline=False,
        has_hyperparameter_tuning=False,
        has_baseline_comparison=False,
        has_evaluation_metrics=False,
        has_system_architecture=False,
        has_survey_structure=False,
        has_case_study=False,
        has_limitations_section=False,
        has_future_work=False,
        primary_domain="general science",
        confidence=0.85,
    )


@pytest.fixture
def sample_parsed_document() -> ParsedDocument:
    return ParsedDocument(
        sections=[
            Section(
                title="Abstract",
                level=1,
                text="This is an abstract about neural network architectures.",
                page_start=1,
                page_end=1,
            ),
            Section(
                title="Methodology",
                level=1,
                text="We propose an attention mechanism that scales quadratically in context length.",
                page_start=2,
                page_end=3,
            ),
            Section(
                title="Experiments",
                level=1,
                text="We evaluate on CIFAR-100 and ImageNet datasets reporting top-1 accuracy.",
                page_start=4,
                page_end=5,
            ),
        ],
        formulas=[Formula(raw_text="Softmax(QK^T / \\sqrt{d})V", page=2)],
        raw_markdown="# Abstract\n\n# Methodology\n\n# Experiments",
        total_pages=5,
    )


def test_route_sections_always_active_only(minimal_paper_profile):
    """Bayraklar kapalıyken sadece always_active grupların geldiğini test eder."""
    routes = route_sections(minimal_paper_profile)
    group_ids = [r.group_id for r in routes]

    assert "core_summary" in group_ids
    assert "method_steps" in group_ids
    assert len(routes) == 2


def test_route_sections_triggers_matching(minimal_paper_profile):
    """İlgili bayraklar aktif olduğunda doğru section gruplarının tetiklendiğini test eder."""
    profile = minimal_paper_profile.model_copy(
        update={
            "has_theorem_proof": True,
            "has_ml_experiment": True,
            "has_dataset": True,
            "has_limitations_section": True,
            "has_future_work": True,
        }
    )
    routes = route_sections(profile)
    group_ids = [r.group_id for r in routes]

    assert "core_summary" in group_ids
    assert "method_steps" in group_ids
    assert "theorem_proofs" in group_ids
    assert "ml_experiment_table" in group_ids
    assert "limitations_future" in group_ids

    # matched_flags kontrolü
    ml_group = next(r for r in routes if r.group_id == "ml_experiment_table")
    assert "has_ml_experiment" in ml_group.matched_flags
    assert "has_dataset" in ml_group.matched_flags

    lim_group = next(r for r in routes if r.group_id == "limitations_future")
    assert "has_limitations_section" in lim_group.matched_flags
    assert "has_future_work" in lim_group.matched_flags


def test_chunk_section_short_and_long():
    """chunk_section fonksiyonunun kısa ve uzun metinleri doğru böldüğünü test eder."""
    short_sec = Section(
        title="Intro",
        level=1,
        text="Short text.",
        page_start=1,
        page_end=1,
    )
    chunks = chunk_section(short_sec)
    assert len(chunks) == 1
    assert "Section: Intro" in chunks[0]

    # Uzun metin
    long_text = "word " * 1000  # ~5000 karakter
    long_sec = Section(
        title="Long Method",
        level=1,
        text=long_text,
        page_start=2,
        page_end=4,
    )
    long_chunks = chunk_section(long_sec, max_chunk_chars=1500, overlap=100)
    assert len(long_chunks) > 1
    assert "Section: Long Method (Part 1)" in long_chunks[0]


def test_vector_store_indexing_and_querying(sample_parsed_document):
    """ChromaDB EphemeralClient ile indeksleme ve metadata filtreli sorgulamayı test eder."""
    test_client = chromadb.EphemeralClient()
    doc_id = "test-doc-123"

    # İndeksle
    chunk_count = index_document(doc_id, sample_parsed_document, client=test_client)
    assert chunk_count == 3

    # Genel döküman sorgusu
    results = query_document(doc_id, "attention mechanism", n_results=2, client=test_client)
    assert len(results) > 0
    assert any("attention mechanism" in r["content"] for r in results)
    assert results[0]["metadata"]["document_id"] == doc_id

    # Section filtreli sorgu
    exp_results = query_document(
        doc_id,
        "accuracy metrics",
        section_filter="Experiments",
        n_results=2,
        client=test_client,
    )
    assert len(exp_results) > 0
    for r in exp_results:
        assert r["metadata"]["section_title"] == "Experiments"

    # Farklı document_id sorgusu eşleşmemeli
    other_results = query_document("other-doc-999", "attention", client=test_client)
    assert len(other_results) == 0


def test_route_sections_endpoint(minimal_paper_profile):
    """POST /route-sections endpoint'ini test eder."""
    response = client.post(
        "/route-sections",
        json={"paper_profile": minimal_paper_profile.model_dump()},
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 2
    assert data[0]["group_id"] == "core_summary"


@patch("app.routers.index.index_document")
def test_index_document_endpoint(mock_index, sample_parsed_document):
    """POST /index endpoint'ini test eder."""
    mock_index.return_value = 3

    response = client.post(
        "/index",
        json={
            "document_id": "doc-abc-123",
            "parsed_document": sample_parsed_document.model_dump(),
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "indexed"
    assert data["chunk_count"] == 3


@patch("app.routers.index.index_document")
@patch("app.routers.index.classify_paper")
@patch("app.routers.index.parse_pdf")
def test_parse_classify_index_endpoint_success(
    mock_parse, mock_classify, mock_index, sample_parsed_document, minimal_paper_profile
):
    """POST /parse-classify-index birleşik pipeline endpoint'ini test eder."""
    mock_parse.return_value = sample_parsed_document
    mock_classify.return_value = minimal_paper_profile
    mock_index.return_value = 3

    files = {"file": ("paper.pdf", io.BytesIO(b"%PDF-1.4 dummy"), "application/pdf")}
    response = client.post("/parse-classify-index", files=files)

    assert response.status_code == 200
    data = response.json()
    assert "document_id" in data
    assert "parsed_document" in data
    assert "paper_profile" in data
    assert "active_sections" in data
    assert len(data["active_sections"]) >= 2
