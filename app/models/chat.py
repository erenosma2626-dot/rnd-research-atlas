from pydantic import BaseModel, Field


class ChatSource(BaseModel):
    """Soru-cevapta cevabın dayandığı kaynak sayfa ve bölüm referansı."""

    page: int = Field(..., description="Kaynak sayfa numarası (1-indexed)")
    section_title: str = Field(..., description="Kaynak bölüm başlığı")


class ChatMessage(BaseModel):
    """Sohbet geçmişi mesaj nesnesi."""

    role: str = Field(..., description="Mesajı gönderen rol ('user' | 'assistant')")
    content: str = Field(..., description="Mesaj metni")


class ChatRequest(BaseModel):
    """POST /chat endpoint'i için istek şeması."""

    document_id: str = Field(
        ..., description="Soru sorulacak dökümanın kimliği (ChromaDB'de indekslenmiş)"
    )
    question: str = Field(..., description="Kullanıcının makale ile ilgili sorusu")
    history: list[ChatMessage] = Field(
        default_factory=list, description="Önceki sohbet mesaj geçmişi (bağlam için)"
    )


class ChatResponse(BaseModel):
    """POST /chat endpoint'i için yanıt şeması."""

    answer: str = Field(..., description="Model tarafından üretilen cevap metni")
    sources: list[ChatSource] = Field(
        default_factory=list, description="Cevabın türetildiği kaynak sayfalar ve bölümler"
    )
