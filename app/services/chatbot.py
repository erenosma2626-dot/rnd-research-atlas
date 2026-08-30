import os
from openai import OpenAI

from app.models.chat import ChatRequest, ChatResponse, ChatSource
from app.services.classifier import LLMCallLog, log_llm_call
from app.services.vector_store import query_document


def get_chat_client() -> tuple[OpenAI, str]:
    """Soru-cevap için Groq istemcisi ve model adını (llama-3.3-70b-versatile) döner."""
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ_API_KEY ortam değişkeni ayarlanmamış.")

    base_url = os.getenv("GROQ_BASE_URL", "https://api.groq.com/openai/v1")
    model = os.getenv("GROQ_CHAT_MODEL", "openai/gpt-oss-20b")
    client = OpenAI(api_key=api_key, base_url=base_url)
    return client, model


def answer_question(request: ChatRequest) -> ChatResponse:
    """Belirli bir döküman üzerinde ChromaDB RAG ve Groq ile soru-cevap yapar.

    - ChromaDB'den ilgili 5 chunk'ı çeker (tüm döküman genelinde arama).
    - Eğer eşleşen chunk yoksa doğrudan 'Bu bilgi makalede bulunmuyor.' döner (LLM tasarrufu).
    - Halüsinasyonu engellemek için sadece verilen bağlama bağlı kalır.
    - Kaynak sayfa ve bölüm referanslarını birlikte döner.

    Args:
        request: Döküman kimliği, soru ve isteğe bağlı geçmişi içeren nesne.

    Returns:
        ChatResponse: Cevap metni ve kaynak referansları.
    """
    # 1. Retrieval
    retrieved_chunks = query_document(
        document_id=request.document_id,
        query=request.question,
        section_filter=None,
        n_results=5,
    )

    # Retrieval boşsa doğrudan tasarruf yanıtı dön
    if not retrieved_chunks:
        return ChatResponse(
            answer="Bu bilgi makalede bulunmuyor.",
            sources=[],
        )

    # Kaynak referanslarını ve bağlam bloklarını oluştur
    sources: list[ChatSource] = []
    seen_sources = set()
    context_blocks = []

    for chunk in retrieved_chunks:
        context_blocks.append(chunk["content"])
        meta = chunk.get("metadata", {})
        page = meta.get("page_start", 1)
        sec_title = meta.get("section_title", "General")
        key = (page, sec_title)
        if key not in seen_sources:
            seen_sources.add(key)
            sources.append(ChatSource(page=page, section_title=sec_title))

    context_text = "\n\n---\n\n".join(context_blocks)

    # 2. LLM Call
    client, model_name = get_chat_client()

    system_prompt = (
        "You are an accurate, objective scientific research assistant. "
        "Answer the user's question using ONLY the provided document context. "
        "If the answer is not mentioned in the context, explicitly respond: 'Bu bilgi makalede bulunmuyor.' "
        "Do not invent facts or speculate beyond what is written in the document context. "
        "Provide your answer clearly in Turkish unless asked otherwise."
    )

    messages = [{"role": "system", "content": system_prompt}]

    # Önceki sohbet geçmişini ekle (varsa)
    for hist_msg in request.history:
        messages.append({"role": hist_msg.role, "content": hist_msg.content})

    # Güncel soru ve bağlamı ekle
    user_prompt = (
        f"Aşağıdaki döküman bağlamını kullanarak soruyu cevapla:\n\n"
        f"--- DÖKÜMAN BAĞLAMI ---\n{context_text}\n\n"
        f"--- KULLANICI SORUSU ---\n{request.question}"
    )
    messages.append({"role": "user", "content": user_prompt})

    from app.services.rate_limiter import execute_with_retry

    try:
        response = execute_with_retry(
            client.chat.completions.create,
            model=model_name,
            messages=messages,
            temperature=0.1,
            max_retries=5,
        )

        answer_text = response.choices[0].message.content or "Bu bilgi makalede bulunmuyor."

        # Token kullanım loglama
        log_llm_call(
            LLMCallLog(
                call_type="chatbot",
                model=model_name,
                input_tokens=0,
                output_tokens=0,
            )
        )

        return ChatResponse(
            answer=answer_text.strip(),
            sources=sources,
        )
    except Exception as e:
        return ChatResponse(
            answer=f"Cevap üretilirken bir hata oluştu: {str(e)}",
            sources=sources,
        )
