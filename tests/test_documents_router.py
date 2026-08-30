from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4
from fastapi.testclient import TestClient
import pytest

from app.config.constants import DEFAULT_PROJECT_ID, DEFAULT_USER_ID
from app.db.base import get_async_db
from app.db.models import Document, Report, Section
from app.main import app

client = TestClient(app)


@pytest.fixture
def mock_db_session():
    return AsyncMock()


def test_upload_document_async_endpoint(mock_db_session):
    """POST /documents/upload asenkron yükleme endpoint testi."""
    app.dependency_overrides[get_async_db] = lambda: mock_db_session

    with patch("app.routers.documents.upload_file", return_value="s3://documents/doc.pdf"), \
         patch("app.routers.documents.process_document_task.delay") as mock_delay, \
         patch("app.routers.documents.DocumentRepository.create", new_callable=AsyncMock) as mock_create, \
         patch("app.routers.documents.DocumentRepository.add_to_project", new_callable=AsyncMock) as mock_add:

        file_content = b"%PDF-1.5 sample content"
        response = client.post(
            f"/documents/upload?project_id={DEFAULT_PROJECT_ID}",
            files={"file": ("sample.pdf", file_content, "application/pdf")},
        )
        assert response.status_code == 202
        data = response.json()
        assert data["original_filename"] == "sample.pdf"
        assert data["processing_status"] == "pending"
        assert "document_id" in data
        mock_delay.assert_called_once()

    app.dependency_overrides.pop(get_async_db, None)


def test_get_document_status_endpoint(mock_db_session):
    """GET /documents/{document_id}/status durum sorgulama testi."""
    app.dependency_overrides[get_async_db] = lambda: mock_db_session

    doc_id = uuid4()
    mock_doc = Document(
        id=doc_id,
        original_filename="paper.pdf",
        storage_path="s3://documents/paper.pdf",
        uploaded_at=datetime.now(timezone.utc),
        processing_status="processing",
        error_message=None,
        deleted_at=None,
    )

    with patch("app.routers.documents.DocumentRepository.get_by_id", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = mock_doc

        response = client.get(f"/documents/{doc_id}/status")
        assert response.status_code == 200
        data = response.json()
        assert data["document_id"] == str(doc_id)
        assert data["processing_status"] == "processing"
        assert data["error_message"] is None

    app.dependency_overrides.pop(get_async_db, None)


def test_list_project_documents_endpoint(mock_db_session):
    """GET /projects/{project_id}/documents endpoint testi."""
    app.dependency_overrides[get_async_db] = lambda: mock_db_session

    doc_id = uuid4()
    mock_doc = Document(
        id=doc_id,
        original_filename="sample_paper.pdf",
        storage_path="s3://documents/papers/sample_paper.pdf",
        uploaded_at=datetime.now(timezone.utc),
        processing_status="done",
    )

    with patch("app.routers.documents.DocumentRepository.list_by_project", new_callable=AsyncMock) as mock_list:
        mock_list.return_value = [mock_doc]

        response = client.get(f"/projects/{DEFAULT_PROJECT_ID}/documents")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["original_filename"] == "sample_paper.pdf"
        assert data[0]["processing_status"] == "done"

    app.dependency_overrides.pop(get_async_db, None)


def test_get_document_report_endpoint(mock_db_session):
    """GET /documents/{document_id}/report geçmiş rapor sorgulama testi."""
    app.dependency_overrides[get_async_db] = lambda: mock_db_session

    doc_id = uuid4()
    report_id = uuid4()
    mock_doc = Document(
        id=doc_id,
        original_filename="attention.pdf",
        storage_path="s3://documents/attention.pdf",
        uploaded_at=datetime.now(timezone.utc),
        processing_status="done",
        deleted_at=None,
    )
    mock_report = Report(
        id=report_id,
        document_id=doc_id,
        version=1,
        paper_profile={
            "has_theorem_proof": False,
            "has_heavy_notation": False,
            "has_algorithm_pseudocode": False,
            "has_complexity_analysis": False,
            "has_optimization_formulation": False,
            "has_ml_experiment": True,
            "has_ablation_study": True,
            "has_dataset": True,
            "has_preprocessing_pipeline": False,
            "has_hyperparameter_tuning": False,
            "has_baseline_comparison": True,
            "has_evaluation_metrics": True,
            "has_system_architecture": False,
            "has_survey_structure": False,
            "has_case_study": False,
            "has_limitations_section": False,
            "has_future_work": False,
            "primary_domain": "Machine Learning",
            "confidence": 0.95,
        },
        generated_at=datetime.now(timezone.utc),
    )
    mock_section = Section(
        id=uuid4(),
        report_id=report_id,
        section_type="prose",
        title="Özet ve Katkı",
        content={"text": "Bu çalışma transformatör mimarisini tanıtır.", "sources": [{"page": 1, "section_title": "Abstract"}]},
        order=1,
        diagram=None,
    )

    with patch("app.routers.documents.DocumentRepository.get_by_id", new_callable=AsyncMock) as mock_get_doc, \
         patch("app.routers.documents.ReportRepository.get_latest_by_document", new_callable=AsyncMock) as mock_get_rep, \
         patch("app.routers.documents.SectionRepository.get_by_report", new_callable=AsyncMock) as mock_get_sec:

        mock_get_doc.return_value = mock_doc
        mock_get_rep.return_value = mock_report
        mock_get_sec.return_value = [mock_section]

        response = client.get(f"/documents/{doc_id}/report")
        assert response.status_code == 200
        data = response.json()
        assert data["document_id"] == str(doc_id)
        assert data["paper_profile"]["primary_domain"] == "Machine Learning"
        assert len(data["sections"]) == 1
        assert data["sections"][0]["title"] == "Özet ve Katkı"

    app.dependency_overrides.pop(get_async_db, None)


def test_get_document_original_url_endpoint(mock_db_session):
    """GET /documents/{document_id}/original indirme URL testi."""
    app.dependency_overrides[get_async_db] = lambda: mock_db_session

    doc_id = uuid4()
    mock_doc = Document(
        id=doc_id,
        original_filename="paper.pdf",
        storage_path="s3://documents/papers/paper.pdf",
        uploaded_at=datetime.now(timezone.utc),
        processing_status="done",
        deleted_at=None,
    )

    with patch("app.routers.documents.DocumentRepository.get_by_id", new_callable=AsyncMock) as mock_get_doc, \
         patch("app.routers.documents.get_presigned_url") as mock_presigned:

        mock_get_doc.return_value = mock_doc
        mock_presigned.return_value = "https://minio.local/documents/paper.pdf?token=abc"

        response = client.get(f"/documents/{doc_id}/original")
        assert response.status_code == 200
        data = response.json()
        assert data["document_id"] == str(doc_id)
        assert data["original_filename"] == "paper.pdf"
        assert "https://minio.local" in data["download_url"]

    app.dependency_overrides.pop(get_async_db, None)


def test_delete_document_endpoint(mock_db_session):
    """DELETE /documents/{document_id} soft delete testi."""
    app.dependency_overrides[get_async_db] = lambda: mock_db_session

    doc_id = uuid4()
    with patch("app.routers.documents.DocumentRepository.soft_delete", new_callable=AsyncMock) as mock_delete:
        mock_delete.return_value = True

        response = client.delete(f"/documents/{doc_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "deleted"
        assert data["document_id"] == str(doc_id)

    app.dependency_overrides.pop(get_async_db, None)


def test_get_project_inventory_endpoint(mock_db_session):
    """GET /projects/{project_id}/inventory envanter sorgu testi."""
    app.dependency_overrides[get_async_db] = lambda: mock_db_session

    project_id = uuid4()
    doc_id = uuid4()
    canvas_id = uuid4()
    user_id = uuid4()

    mock_inventory_items = [
        {
            "id": doc_id,
            "original_filename": "paper_inventory.pdf",
            "storage_path": "s3://documents/paper.pdf",
            "uploaded_at": datetime.now(timezone.utc),
            "added_at": datetime.now(timezone.utc),
            "added_by": {
                "id": user_id,
                "display_name": "ArGe Uzmanı",
                "email": "arge@lab.io",
            },
            "is_own": True,
            "processing_status": "done",
            "used_in_canvases": [
                {"canvas_id": canvas_id, "canvas_name": "Ana Canvas"}
            ],
        }
    ]

    with patch("app.routers.documents.InventoryRepository.get_project_inventory", new_callable=AsyncMock) as mock_get_inv:
        mock_get_inv.return_value = mock_inventory_items

        response = client.get(f"/projects/{project_id}/inventory")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["id"] == str(doc_id)
        assert data[0]["original_filename"] == "paper_inventory.pdf"
        assert data[0]["added_by"]["display_name"] == "ArGe Uzmanı"
        assert data[0]["is_own"] is True
        assert len(data[0]["used_in_canvases"]) == 1
        assert data[0]["used_in_canvases"][0]["canvas_name"] == "Ana Canvas"

    app.dependency_overrides.pop(get_async_db, None)


def test_add_existing_document_to_project_endpoint(mock_db_session):
    """POST /projects/{project_id}/documents mevcut dokümanı bağlama testi."""
    app.dependency_overrides[get_async_db] = lambda: mock_db_session

    project_id = uuid4()
    doc_id = uuid4()
    mock_doc = Document(
        id=doc_id,
        original_filename="reusable_paper.pdf",
        storage_path="s3://documents/reusable.pdf",
        uploaded_at=datetime.now(timezone.utc),
        processing_status="done",
        deleted_at=None,
    )

    with patch("app.routers.documents.DocumentRepository.get_by_id", new_callable=AsyncMock) as mock_get_doc, \
         patch("app.routers.documents.DocumentRepository.add_to_project", new_callable=AsyncMock) as mock_add:
        mock_get_doc.return_value = mock_doc
        mock_add.return_value = None

        response = client.post(
            f"/projects/{project_id}/documents",
            json={"document_id": str(doc_id)},
        )
        assert response.status_code == 201
        data = response.json()
        assert data["status"] == "added"
        assert data["document_id"] == str(doc_id)
        assert data["original_filename"] == "reusable_paper.pdf"

    app.dependency_overrides.pop(get_async_db, None)
