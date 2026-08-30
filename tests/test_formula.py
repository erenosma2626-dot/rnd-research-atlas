from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient
import pytest

from app.main import app
from app.models.document import Formula, ParsedDocument, Section
from app.models.formula import ExtractedFormula
from app.services.formula_extractor import (
    clean_latex_string,
    extract_all_formulas,
    extract_formula_latex,
)

client = TestClient(app)


def test_clean_latex_string():
    """clean_latex_string temizleme fonksiyonunu test eder."""
    assert clean_latex_string("$$E = mc^2$$") == "E = mc^2"
    assert clean_latex_string("```latex\n\\int_0^1 x dx\n```") == "\\int_0^1 x dx"
    assert clean_latex_string("  $f(x) = ax + b$  ") == "f(x) = ax + b"


@patch("app.services.formula_extractor.OpenAI")
def test_extract_formula_latex_llm_fallback(mock_openai_class, monkeypatch):
    """LLM fallback çalıştığında low_confidence=True ve method='llm_fallback' olmalı."""
    monkeypatch.setenv("GROQ_API_KEY", "dummy_key")

    mock_client = MagicMock()
    mock_choice = MagicMock()
    mock_choice.message.content = "$$\\nabla f(x) = 0$$"
    mock_client.chat.completions.create.return_value = MagicMock(choices=[mock_choice])
    mock_openai_class.return_value = mock_client

    result = extract_formula_latex("grad f(x) = 0", page=2)

    assert result.page == 2
    assert result.latex_code == "\\nabla f(x) = 0"
    assert result.method == "llm_fallback"
    # LLM fallback kuralı: daima low_confidence=True
    assert result.low_confidence is True


def test_extract_formula_latex_empty_string():
    """Boş formül metninde failed dönülmesi."""
    result = extract_formula_latex("", page=1)
    assert result.method == "failed"
    assert result.latex_code is None
    assert result.low_confidence is True


@patch("app.services.formula_extractor.extract_formula_latex")
def test_extract_all_formulas(mock_extract):
    """extract_all_formulas fonksiyonunun tüm listeyi dönüştürmesi."""
    mock_extract.return_value = ExtractedFormula(
        raw_text="x + y",
        page=1,
        latex_code="x + y",
        method="pix2tex",
        low_confidence=False,
    )

    items = [
        Formula(raw_text="x + y", page=1),
        {"raw_text": "a = b", "page": 2},
    ]
    results = extract_all_formulas(items)

    assert len(results) == 2
    assert results[0].latex_code == "x + y"
    assert mock_extract.call_count == 2


@patch("app.routers.formula.extract_all_formulas")
def test_extract_formulas_endpoint(mock_extract):
    """POST /extract-formulas endpoint testi."""
    mock_extract.return_value = [
        ExtractedFormula(
            raw_text="L = sum(w)",
            page=3,
            latex_code="L = \\sum w",
            method="llm_fallback",
            low_confidence=True,
        )
    ]

    doc = ParsedDocument(
        sections=[],
        formulas=[Formula(raw_text="L = sum(w)", page=3)],
        raw_markdown="# Title",
        total_pages=3,
    )

    response = client.post(
        "/extract-formulas",
        json={
            "document_id": "doc-formulas-123",
            "parsed_document": doc.model_dump(),
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["document_id"] == "doc-formulas-123"
    assert len(data["formulas"]) == 1
    assert data["formulas"][0]["latex_code"] == "L = \\sum w"
    assert data["formulas"][0]["low_confidence"] is True
