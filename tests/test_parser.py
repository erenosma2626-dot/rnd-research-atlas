import io
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient
import pytest

from app.main import app
from app.models.document import Formula, ParsedDocument, Section
from app.parsers.docling_parser import parse_pdf

client = TestClient(app)


def test_models_instantiation():
    """Pydantic şemalarının doğruluğunu test eder."""
    section = Section(
        title="Introduction",
        level=1,
        text="This is an introduction.",
        page_start=1,
        page_end=2,
    )
    assert section.title == "Introduction"
    assert section.level == 1
    assert section.page_start == 1
    assert section.page_end == 2

    formula = Formula(raw_text="E = mc^2", page=1)
    assert formula.raw_text == "E = mc^2"
    assert formula.page == 1

    doc = ParsedDocument(
        sections=[section],
        formulas=[formula],
        raw_markdown="# Introduction\nThis is an introduction.",
        total_pages=2,
    )
    assert len(doc.sections) == 1
    assert len(doc.formulas) == 1
    assert doc.total_pages == 2


def test_health_check_endpoint():
    """GET /health endpoint'inin 200 ve doğru json döndüğünü test eder."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_parse_invalid_file_extension():
    """PDF harici dosya yüklendiğinde 400 hatası alındığını test eder."""
    files = {"file": ("test.txt", io.BytesIO(b"dummy text"), "text/plain")}
    response = client.post("/parse", files=files)
    assert response.status_code == 400
    assert "PDF" in response.json()["detail"]


@patch("app.routers.parse.parse_pdf")
def test_parse_endpoint_success(mock_parse):
    """POST /parse başarılı olduğunda ParsedDocument döndüğünü test eder."""
    mock_doc = ParsedDocument(
        sections=[
            Section(
                title="Abstract",
                level=1,
                text="This is an abstract.",
                page_start=1,
                page_end=1,
            )
        ],
        formulas=[Formula(raw_text="x + y = z", page=1)],
        raw_markdown="# Abstract\nThis is an abstract.",
        total_pages=1,
    )
    mock_parse.return_value = mock_doc

    files = {"file": ("sample.pdf", io.BytesIO(b"%PDF-1.4 dummy pdf content"), "application/pdf")}
    response = client.post("/parse", files=files)

    assert response.status_code == 200
    data = response.json()
    assert data["total_pages"] == 1
    assert len(data["sections"]) == 1
    assert data["sections"][0]["title"] == "Abstract"
    assert len(data["formulas"]) == 1
    assert data["formulas"][0]["raw_text"] == "x + y = z"


def test_parse_pdf_file_not_found():
    """Var olmayan dosya için FileNotFoundError fırlatıldığını test eder."""
    with pytest.raises(FileNotFoundError):
        parse_pdf("/non/existent/path/paper.pdf")
