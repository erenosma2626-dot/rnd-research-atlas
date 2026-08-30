from unittest.mock import AsyncMock, patch
from uuid import uuid4
from datetime import datetime, timezone
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.db.models import Canvas, CanvasItem, Document

client = TestClient(app)


@pytest.fixture
def mock_canvas():
    return Canvas(
        id=uuid4(),
        project_id=uuid4(),
        name="Test Canvas",
        created_at=datetime.now(timezone.utc),
    )


@pytest.fixture
def mock_canvas_item(mock_canvas):
    return CanvasItem(
        id=uuid4(),
        canvas_id=mock_canvas.id,
        item_type="document_box",
        ref_id=uuid4(),
        position_x=120.0,
        position_y=240.0,
        content={"title": "Test Paper.pdf"},
    )


@pytest.fixture
def mock_note_item(mock_canvas):
    return CanvasItem(
        id=uuid4(),
        canvas_id=mock_canvas.id,
        item_type="note",
        ref_id=None,
        position_x=300.0,
        position_y=150.0,
        content={"text": "Önemli formül ve sonuçlar"},
    )


@pytest.fixture
def mock_connection_item(mock_canvas):
    return CanvasItem(
        id=uuid4(),
        canvas_id=mock_canvas.id,
        item_type="connection",
        ref_id=None,
        position_x=0.0,
        position_y=0.0,
        content={
            "from_item_id": str(uuid4()),
            "to_item_id": str(uuid4()),
            "label": "Referans Alır",
        },
    )


def test_create_canvas_endpoint(mock_canvas):
    with patch("app.routers.canvas.CanvasRepository.create", new_callable=AsyncMock) as mock_create:
        mock_create.return_value = mock_canvas

        response = client.post(
            f"/projects/{mock_canvas.project_id}/canvases",
            json={"name": "Yeni Canvas"},
        )
        assert response.status_code == 201
        data = response.json()
        assert data["id"] == str(mock_canvas.id)
        assert data["name"] == mock_canvas.name


def test_list_project_canvases_endpoint(mock_canvas):
    with patch("app.routers.canvas.CanvasRepository.list_by_project", new_callable=AsyncMock) as mock_list:
        mock_list.return_value = [mock_canvas]

        response = client.get(f"/projects/{mock_canvas.project_id}/canvases")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["id"] == str(mock_canvas.id)


def test_get_canvas_items_endpoint(mock_canvas, mock_canvas_item, mock_note_item, mock_connection_item):
    with patch("app.routers.canvas.CanvasRepository.get_by_id", new_callable=AsyncMock) as mock_get_canvas, \
         patch("app.routers.canvas.CanvasItemRepository.list_by_canvas", new_callable=AsyncMock) as mock_list_items, \
         patch("app.routers.canvas.DocumentRepository.get_by_id", new_callable=AsyncMock) as mock_get_doc:

        mock_get_canvas.return_value = mock_canvas
        mock_list_items.return_value = [mock_canvas_item, mock_note_item, mock_connection_item]
        mock_get_doc.return_value = Document(
            id=mock_canvas_item.ref_id,
            original_filename="Test Paper.pdf",
            storage_path="papers/test.pdf",
            processing_status="done",
        )

        response = client.get(f"/canvases/{mock_canvas.id}/items")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 3
        assert data[0]["id"] == str(mock_canvas_item.id)
        assert data[0]["document_title"] == "Test Paper.pdf"
        assert data[1]["item_type"] == "note"
        assert data[1]["content"]["text"] == "Önemli formül ve sonuçlar"
        assert data[2]["item_type"] == "connection"
        assert data[2]["content"]["label"] == "Referans Alır"


def test_add_canvas_item_endpoint(mock_canvas, mock_canvas_item):
    with patch("app.routers.canvas.CanvasRepository.get_by_id", new_callable=AsyncMock) as mock_get_canvas, \
         patch("app.routers.canvas.CanvasItemRepository.create", new_callable=AsyncMock) as mock_create_item, \
         patch("app.routers.canvas.DocumentRepository.get_by_id", new_callable=AsyncMock) as mock_get_doc:

        mock_get_canvas.return_value = mock_canvas
        mock_create_item.return_value = mock_canvas_item
        mock_get_doc.return_value = Document(
            id=mock_canvas_item.ref_id,
            original_filename="Test Paper.pdf",
            storage_path="papers/test.pdf",
            processing_status="done",
        )

        response = client.post(
            f"/canvases/{mock_canvas.id}/items",
            json={
                "item_type": "document_box",
                "ref_id": str(mock_canvas_item.ref_id),
                "position_x": 120.0,
                "position_y": 240.0,
                "content": {"title": "Test Paper.pdf"},
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["id"] == str(mock_canvas_item.id)
        assert data["position_x"] == 120.0


def test_add_connection_item_endpoint(mock_canvas, mock_connection_item):
    with patch("app.routers.canvas.CanvasRepository.get_by_id", new_callable=AsyncMock) as mock_get_canvas, \
         patch("app.routers.canvas.CanvasItemRepository.create", new_callable=AsyncMock) as mock_create_item:

        mock_get_canvas.return_value = mock_canvas
        mock_create_item.return_value = mock_connection_item

        response = client.post(
            f"/canvases/{mock_canvas.id}/items",
            json={
                "item_type": "connection",
                "position_x": 0.0,
                "position_y": 0.0,
                "content": mock_connection_item.content,
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["item_type"] == "connection"
        assert data["content"]["label"] == "Referans Alır"


def test_update_canvas_item_content_and_position_endpoint(mock_note_item):
    with patch("app.routers.canvas.CanvasItemRepository.update_item", new_callable=AsyncMock) as mock_update:
        mock_note_item.position_x = 350.0
        mock_note_item.position_y = 500.0
        mock_note_item.content = {"text": "Güncellenmiş not içeriği"}
        mock_update.return_value = mock_note_item

        response = client.patch(
            f"/canvas-items/{mock_note_item.id}",
            json={
                "position_x": 350.0,
                "position_y": 500.0,
                "content": {"text": "Güncellenmiş not içeriği"},
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["position_x"] == 350.0
        assert data["position_y"] == 500.0
        assert data["content"]["text"] == "Güncellenmiş not içeriği"


def test_rename_canvas_endpoint(mock_canvas):
    with patch("app.routers.canvas.CanvasRepository.rename", new_callable=AsyncMock) as mock_rename:
        mock_canvas.name = "Yeni İsimli Canvas"
        mock_rename.return_value = mock_canvas

        response = client.patch(
            f"/canvases/{mock_canvas.id}",
            json={"name": "Yeni İsimli Canvas"},
        )
        assert response.status_code == 200
        assert response.json()["name"] == "Yeni İsimli Canvas"


def test_delete_canvas_endpoint(mock_canvas):
    with patch("app.routers.canvas.CanvasRepository.soft_delete", new_callable=AsyncMock) as mock_delete:
        mock_delete.return_value = True

        response = client.delete(f"/canvases/{mock_canvas.id}")
        assert response.status_code == 200
        assert response.json()["status"] == "deleted"


def test_delete_canvas_item_endpoint():
    item_id = uuid4()
    with patch("app.routers.canvas.CanvasItemRepository.delete", new_callable=AsyncMock) as mock_delete:
        mock_delete.return_value = True

        response = client.delete(f"/canvas-items/{item_id}")
        assert response.status_code == 200
        assert response.json()["status"] == "deleted"
