from datetime import datetime
from unittest.mock import MagicMock, patch
from uuid import uuid4
import pytest

from app.db.base import get_database_url
from app.db.models import (
    Document,
    DocumentTag,
    Note,
    Project,
    ProjectDocument,
    Report,
    Section,
    Tag,
    User,
)
from app.storage.object_store import (
    delete_file,
    download_file,
    ensure_bucket_exists,
    get_presigned_url,
    parse_storage_path,
    upload_bytes,
    upload_file,
)


def test_get_database_url_formatting(monkeypatch):
    """postgres:// formatının postgresql+asyncpg:// formatına dönüştürülmesi."""
    monkeypatch.setenv("DATABASE_URL", "postgres://user:pass@localhost:5432/db")
    url = get_database_url()
    assert url.startswith("postgresql+asyncpg://")

    monkeypatch.setenv("DATABASE_URL", "postgresql://user:pass@localhost:5432/db")
    url2 = get_database_url()
    assert url2.startswith("postgresql+asyncpg://")


def test_orm_models_instantiation():
    """Tüm Phase 2 ORM modellerinin doğru alan ve tiplerle oluşturulabilmesi."""
    user_id = uuid4()
    user = User(
        id=user_id,
        email="researcher@atlas.org",
        display_name="Dr. Atlas",
    )
    assert user.email == "researcher@atlas.org"
    assert user.display_name == "Dr. Atlas"

    project = Project(
        id=uuid4(),
        name="Attention Research",
        owner_id=user_id,
    )
    assert project.name == "Attention Research"
    assert project.owner_id == user_id

    doc = Document(
        id=uuid4(),
        original_filename="paper.pdf",
        storage_path="s3://documents/papers/paper.pdf",
        processing_status="completed",
    )
    assert doc.original_filename == "paper.pdf"
    assert doc.processing_status == "completed"

    proj_doc = ProjectDocument(
        project_id=project.id,
        document_id=doc.id,
        added_by=user_id,
    )
    assert proj_doc.project_id == project.id
    assert proj_doc.document_id == doc.id

    report = Report(
        id=uuid4(),
        document_id=doc.id,
        version=1,
        paper_profile={"has_ml_experiments": True, "primary_domain": "NLP"},
    )
    assert report.version == 1
    assert report.paper_profile["primary_domain"] == "NLP"

    section = Section(
        id=uuid4(),
        report_id=report.id,
        section_type="prose",
        title="Özet ve Katkı",
        content={"text": "Bu çalışma yeni bir mimari önerir."},
        order=1,
        diagram={"mermaid_code": "flowchart TD\n a-->b"},
    )
    assert section.title == "Özet ve Katkı"
    assert section.order == 1
    assert section.diagram is not None

    note = Note(
        id=uuid4(),
        section_id=section.id,
        author_id=user_id,
        content="Önemli metodoloji notu",
    )
    assert note.content == "Önemli metodoloji notu"

    tag = Tag(
        id=uuid4(),
        name="Transformer",
        color="#0071E3",
    )
    assert tag.name == "Transformer"

    doc_tag = DocumentTag(
        document_id=doc.id,
        tag_id=tag.id,
    )
    assert doc_tag.document_id == doc.id
    assert doc_tag.tag_id == tag.id


def test_parse_storage_path():
    """parse_storage_path fonksiyonunun URI ayrıştırması."""
    bucket, obj = parse_storage_path("s3://documents/papers/2026/test.pdf")
    assert bucket == "documents"
    assert obj == "papers/2026/test.pdf"

    bucket2, obj2 = parse_storage_path("mybucket/subfolder/file.pdf")
    assert bucket2 == "mybucket"
    assert obj2 == "subfolder/file.pdf"


@patch("app.storage.object_store.get_minio_client")
def test_ensure_bucket_exists(mock_get_client):
    """ensure_bucket_exists bucket oluşturma testi."""
    mock_client = MagicMock()
    mock_client.bucket_exists.return_value = False
    mock_get_client.return_value = mock_client

    ensure_bucket_exists("test-bucket")
    mock_client.bucket_exists.assert_called_with("test-bucket")
    mock_client.make_bucket.assert_called_with("test-bucket")


@patch("app.storage.object_store.ensure_bucket_exists")
@patch("app.storage.object_store.get_minio_client")
def test_upload_file(mock_get_client, mock_ensure_bucket, tmp_path):
    """upload_file fonksiyonunun s3 URI dönmesi."""
    mock_client = MagicMock()
    mock_get_client.return_value = mock_client

    sample_file = tmp_path / "test.pdf"
    sample_file.write_bytes(b"%PDF-1.4 test")

    uri = upload_file(str(sample_file), bucket="documents", object_name="papers/test.pdf")
    assert uri == "s3://documents/papers/test.pdf"
    mock_client.fput_object.assert_called_once()


@patch("app.storage.object_store.ensure_bucket_exists")
@patch("app.storage.object_store.get_minio_client")
def test_upload_bytes(mock_get_client, mock_ensure_bucket):
    """upload_bytes fonksiyonunun s3 URI dönmesi."""
    mock_client = MagicMock()
    mock_get_client.return_value = mock_client

    uri = upload_bytes(b"hello world", bucket="documents", object_name="doc.pdf")
    assert uri == "s3://documents/doc.pdf"
    mock_client.put_object.assert_called_once()


@patch("app.storage.object_store.get_minio_client")
def test_download_file(mock_get_client):
    """download_file fonksiyonunun fget_object çağırması."""
    mock_client = MagicMock()
    mock_get_client.return_value = mock_client

    download_file("s3://documents/doc.pdf", "/tmp/local_doc.pdf")
    mock_client.fget_object.assert_called_with(
        bucket_name="documents",
        object_name="doc.pdf",
        file_path="/tmp/local_doc.pdf",
    )


@patch("app.storage.object_store.get_minio_client")
def test_delete_file(mock_get_client):
    """delete_file fonksiyonunun remove_object çağırması."""
    mock_client = MagicMock()
    mock_get_client.return_value = mock_client

    delete_file("s3://documents/doc.pdf")
    mock_client.remove_object.assert_called_with(
        bucket_name="documents",
        object_name="doc.pdf",
    )


@patch("app.storage.object_store.get_minio_client")
def test_get_presigned_url(mock_get_client):
    """get_presigned_url fonksiyonunun imzalı URL dönmesi."""
    mock_client = MagicMock()
    mock_client.presigned_get_object.return_value = "https://minio.local/documents/doc.pdf?signature=123"
    mock_get_client.return_value = mock_client

    url = get_presigned_url("s3://documents/doc.pdf", expires_seconds=1800)
    assert "https://minio.local" in url
    mock_client.presigned_get_object.assert_called_once()
