from datetime import datetime, timezone
import io
import json
from pathlib import Path
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient
import pytest
from pydantic import ValidationError

from app.main import app
from app.models.document import Formula, ParsedDocument, Section
from app.models.paper_profile import PaperProfile
from app.services.classifier import (
    LLMCallLog,
    build_classification_input,
    classify_paper,
    get_instructor_client,
    log_llm_call,
)

client = TestClient(app)


@pytest.fixture
def sample_parsed_document() -> ParsedDocument:
    return ParsedDocument(
        sections=[
            Section(
                title="Abstract",
                level=1,
                text="This paper introduces a novel optimization method for neural networks.",
                page_start=1,
                page_end=1,
            ),
            Section(
                title="1. Introduction",
                level=1,
                text="Deep learning models require efficient optimization algorithms.",
                page_start=1,
                page_end=2,
            ),
            Section(
                title="2. Proposed Method",
                level=2,
                text="We formulate the objective function with adaptive learning rates.",
                page_start=2,
                page_end=4,
            ),
        ],
        formulas=[Formula(raw_text="L(\\theta) = \\sum_i (y_i - f(x_i))^2", page=3)],
        raw_markdown="# Abstract\n\n# 1. Introduction\n\n## 2. Proposed Method",
        total_pages=5,
    )


@pytest.fixture
def sample_paper_profile() -> PaperProfile:
    return PaperProfile(
        has_theorem_proof=False,
        has_heavy_notation=True,
        has_algorithm_pseudocode=True,
        has_complexity_analysis=False,
        has_optimization_formulation=True,
        has_ml_experiment=True,
        has_ablation_study=True,
        has_dataset=True,
        has_preprocessing_pipeline=False,
        has_hyperparameter_tuning=True,
        has_baseline_comparison=True,
        has_evaluation_metrics=True,
        has_system_architecture=False,
        has_survey_structure=False,
        has_case_study=False,
        has_limitations_section=True,
        has_future_work=True,
        primary_domain="machine learning optimization",
        confidence=0.92,
    )


def test_paper_profile_validation(sample_paper_profile):
    """PaperProfile alanlarını ve kısıtlamalarını test eder."""
    assert sample_paper_profile.confidence == 0.92
    assert sample_paper_profile.has_ml_experiment is True
    assert sample_paper_profile.primary_domain == "machine learning optimization"

    with pytest.raises(ValidationError):
        PaperProfile(
            **{**sample_paper_profile.model_dump(), "confidence": 1.5}
        )

    with pytest.raises(ValidationError):
        PaperProfile(
            **{**sample_paper_profile.model_dump(), "confidence": -0.1}
        )


def test_build_classification_input(sample_parsed_document):
    """build_classification_input fonksiyonunun düşük-context yapısını test eder."""
    prompt_input = build_classification_input(sample_parsed_document)

    assert "TOTAL PAGES: 5" in prompt_input
    assert "EXTRACTED FORMULAS COUNT: 1" in prompt_input
    assert "Abstract" in prompt_input
    assert "1. Introduction" in prompt_input
    assert "2. Proposed Method" in prompt_input
    assert "novel optimization method" in prompt_input


def test_get_instructor_client_missing_key(monkeypatch):
    """GROQ_API_KEY yoksa açık hata fırlatıldığını test eder."""
    monkeypatch.delenv("GROQ_API_KEY", raising=False)
    with pytest.raises(ValueError) as exc_info:
        get_instructor_client()
    assert "GROQ_API_KEY" in str(exc_info.value)


def test_log_llm_call(tmp_path):
    """LLMCallLog ve log_llm_call fonksiyonunu test eder."""
    log_file = tmp_path / "test_llm_calls.jsonl"
    entry = LLMCallLog(
        call_type="classification",
        model="llama-3.3-70b-versatile",
        input_tokens=150,
        output_tokens=45,
    )
    log_llm_call(entry, log_file=str(log_file))

    assert log_file.exists()
    with open(log_file, "r") as f:
        line = f.readline()
        data = json.loads(line)
        assert data["call_type"] == "classification"
        assert data["model"] == "llama-3.3-70b-versatile"
        assert data["input_tokens"] == 150
        assert data["output_tokens"] == 45


@patch("app.services.classifier.get_instructor_client")
def test_classify_paper_success(mock_get_client, sample_parsed_document, sample_paper_profile, tmp_path):
    """classify_paper fonksiyonunun başarılı LLM çağrısını test eder."""
    mock_client = MagicMock()
    mock_client.chat.completions.create.return_value = sample_paper_profile
    mock_get_client.return_value = (mock_client, "llama-3.3-70b-versatile")

    result = classify_paper(sample_parsed_document)
    assert result == sample_paper_profile
    assert result.has_optimization_formulation is True
    mock_client.chat.completions.create.assert_called_once()


@patch("app.services.classifier.get_instructor_client")
def test_classify_paper_failure_raises_runtime_error(mock_get_client, sample_parsed_document):
    """classify_paper'ın sessizce default dönmeyip hata fırlattığını test eder."""
    mock_client = MagicMock()
    mock_client.chat.completions.create.side_effect = Exception("Groq rate limit exceeded")
    mock_get_client.return_value = (mock_client, "llama-3.3-70b-versatile")

    with pytest.raises(RuntimeError) as exc_info:
        classify_paper(sample_parsed_document)

    assert "PaperProfile sınıflandırma hatası" in str(exc_info.value)


@patch("app.routers.classify.classify_paper")
def test_classify_endpoint(mock_classify, sample_parsed_document, sample_paper_profile):
    """POST /classify endpoint'ini test eder."""
    mock_classify.return_value = sample_paper_profile

    response = client.post(
        "/classify",
        json={"parsed_document": sample_parsed_document.model_dump()},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["has_ml_experiment"] is True
    assert data["primary_domain"] == "machine learning optimization"
    assert data["confidence"] == 0.92


@patch("app.routers.classify.classify_paper")
@patch("app.routers.classify.parse_pdf")
def test_parse_and_classify_endpoint_success(
    mock_parse, mock_classify, sample_parsed_document, sample_paper_profile
):
    """POST /parse-and-classify birleşik endpoint'ini test eder."""
    mock_parse.return_value = sample_parsed_document
    mock_classify.return_value = sample_paper_profile

    files = {"file": ("paper.pdf", io.BytesIO(b"%PDF-1.4 dummy"), "application/pdf")}
    response = client.post("/parse-and-classify", files=files)

    assert response.status_code == 200
    data = response.json()
    assert "parsed_document" in data
    assert "paper_profile" in data
    assert data["parsed_document"]["total_pages"] == 5
    assert data["paper_profile"]["has_dataset"] is True


def test_parse_and_classify_invalid_file():
    """POST /parse-and-classify geçersiz dosya formatı hatasını test eder."""
    files = {"file": ("paper.txt", io.BytesIO(b"dummy text"), "text/plain")}
    response = client.post("/parse-and-classify", files=files)
    assert response.status_code == 400
