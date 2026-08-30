from fastapi import APIRouter, HTTPException, status

from app.models.chat import ChatRequest, ChatResponse
from app.services.chatbot import answer_question

router = APIRouter(tags=["Chatbot"])


@router.post(
    "/chat",
    response_model=ChatResponse,
    summary="Makale üzerinde soru sor",
    description="ChromaDB'den ilgili döküman parçalarını çeker ve Groq (llama-3.3-70b-versatile) ile kaynak referanslı cevap döner.",
)
async def chat_endpoint(request: ChatRequest) -> ChatResponse:
    """Tek döküman üzerinde serbest soru-cevap yapar."""
    try:
        return answer_question(request)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Soru-cevap sırasında hata oluştu: {str(e)}",
        )
