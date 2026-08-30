from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient
import pytest

from app.main import app
from app.models.chat import ChatMessage, ChatRequest, ChatResponse, ChatSource
from app.services.chatbot import answer_question, get_chat_client

client = TestClient(app)


def test_get_chat_client_missing_key(monkeypatch):
    """GROQ_API_KEY eksik olduğunda ValueError fırlatılmasını test eder."""
    monkeypatch.delenv("GROQ_API_KEY", raising=False)
    with pytest.raises(ValueError) as exc_info:
        get_chat_client()
    assert "GROQ_API_KEY" in str(exc_info.value)


@patch("app.services.chatbot.query_document")
def test_answer_question_empty_retrieval_shortcut(mock_query):
    """ChromaDB'den hiçbir chunk dönmediğinde LLM'e gitmeden doğrudan bulunamadı yanıtı dönmesi."""
    mock_query.return_value = []

    request = ChatRequest(
        document_id="doc-empty",
        question="What is the learning rate?",
    )
    response = answer_question(request)

    assert response.answer == "Bu bilgi makalede bulunmuyor."
    assert len(response.sources) == 0


@patch("app.services.chatbot.get_chat_client")
@patch("app.services.chatbot.query_document")
def test_answer_question_with_retrieval_and_history(mock_query, mock_get_client):
    """Bağlam ve geçmiş ile başarılı soru-cevap testi."""
    mock_query.return_value = [
        {
            "content": "We train our model using AdamW optimizer with a learning rate of 0.001.",
            "metadata": {"page_start": 3, "section_title": "Training Setup"},
            "distance": 0.05,
        }
    ]

    mock_client = MagicMock()
    mock_choice = MagicMock()
    mock_choice.message.content = "Makalede öğrenme oranı (learning rate) 0.001 olarak belirtilmiştir."
    mock_client.chat.completions.create.return_value = MagicMock(choices=[mock_choice])
    mock_get_client.return_value = (mock_client, "llama-3.3-70b-versatile")

    request = ChatRequest(
        document_id="doc-123",
        question="Öğrenme oranı nedir?",
        history=[
            ChatMessage(role="user", content="Hangi optimizer kullanıldı?"),
            ChatMessage(role="assistant", content="AdamW optimizer kullanıldı."),
        ],
    )

    response = answer_question(request)

    assert "0.001" in response.answer
    assert len(response.sources) == 1
    assert response.sources[0].page == 3
    assert response.sources[0].section_title == "Training Setup"
    mock_client.chat.completions.create.assert_called_once()


@patch("app.services.chatbot.get_chat_client")
@patch("app.services.chatbot.query_document")
def test_answer_question_error_handling(mock_query, mock_get_client):
    """LLM çağrısı hata verdiğinde uygulamanın çökmemesi testi."""
    mock_query.return_value = [
        {
            "content": "Some context",
            "metadata": {"page_start": 1, "section_title": "Intro"},
            "distance": 0.1,
        }
    ]

    mock_client = MagicMock()
    mock_client.chat.completions.create.side_effect = Exception("Connection timeout")
    mock_get_client.return_value = (mock_client, "llama-3.3-70b-versatile")

    request = ChatRequest(
        document_id="doc-123",
        question="What is the result?",
    )
    response = answer_question(request)

    assert "hata oluştu" in response.answer.lower()
    assert len(response.sources) == 1


@patch("app.routers.chat.answer_question")
def test_chat_endpoint(mock_answer):
    """POST /chat endpoint testi."""
    mock_answer.return_value = ChatResponse(
        answer="Model doğruluğu %94.5 olarak ölçülmüştür.",
        sources=[ChatSource(page=4, section_title="Results")],
    )

    response = client.post(
        "/chat",
        json={
            "document_id": "doc-test-789",
            "question": "Modelin test doğruluğu nedir?",
            "history": [],
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert "%94.5" in data["answer"]
    assert len(data["sources"]) == 1
    assert data["sources"][0]["page"] == 4
