from datetime import datetime, timezone
import json
import os
from pathlib import Path
from typing import Any
import instructor
from openai import OpenAI
from pydantic import BaseModel, Field

from app.models.document import ParsedDocument
from app.models.paper_profile import PaperProfile


class LLMCallLog(BaseModel):
    """LLM çağrısı token ve kullanım log kaydı."""

    call_type: str = Field(..., description="Çağrı tipi (örn: classification)")
    model: str = Field(..., description="Kullanılan model adı")
    input_tokens: int = Field(default=0, description="Girdi token sayısı")
    output_tokens: int = Field(default=0, description="Çıktı token sayısı")
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), description="Çağrı zamanı")


def log_llm_call(log_entry: LLMCallLog, log_file: str = "logs/llm_calls.jsonl") -> None:
    """LLM çağrı logunu JSONL dosyasına ekler."""
    try:
        path = Path(log_file)
        path.parent.mkdir(parents=True, exist_ok=True)
        with open(path, "a", encoding="utf-8") as f:
            f.write(log_entry.model_dump_json() + "\n")
    except Exception:
        # Loglama hatası ana akışı bloklamasın
        pass


def build_classification_input(parsed_doc: ParsedDocument) -> str:
    """ParsedDocument'ten LLM'e verilecek düşük-context girdiyi hazırlar.

    Maliyet ve token kontrolü için sadece:
    - İlk bölümün tam metnini (genelde Abstract / Giriş)
    - Tüm bölüm başlıklarını ve hiyerarşi seviyelerini (Table of Contents)
    - Toplam sayfa ve formül sayısı gibi yapısal ipuçlarını içerir.

    Args:
        parsed_doc: Docling tarafından ayrıştırılmış doküman.

    Returns:
        str: LLM sınıflandırma istemi için hazırlanmış özet metin.
    """
    lines = []
    lines.append(f"TOTAL PAGES: {parsed_doc.total_pages}")
    lines.append(f"EXTRACTED FORMULAS COUNT: {len(parsed_doc.formulas)}")
    lines.append("\n=== DOCUMENT OUTLINE / SECTION HEADERS ===")

    if parsed_doc.sections:
        for idx, sec in enumerate(parsed_doc.sections, 1):
            indent = "  " * (max(1, sec.level) - 1)
            lines.append(f"{indent}- [Level {sec.level}] {sec.title} (Pages {sec.page_start}-{sec.page_end})")
    else:
        lines.append("(No explicit section headers detected)")

    lines.append("\n=== FIRST SECTION / ABSTRACT ===")
    if parsed_doc.sections:
        first_sec = parsed_doc.sections[0]
        lines.append(f"Title: {first_sec.title}")
        lines.append(f"Content:\n{first_sec.text[:3000]}")
    else:
        lines.append(parsed_doc.raw_markdown[:3000])

    return "\n".join(lines)


def get_instructor_client() -> tuple[Any, str]:
    """Groq API için yapılandırılmış Instructor istemcisi ve model adını döner.

    Returns:
        tuple[Any, str]: (instructor_client, model_name)
    """
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise ValueError(
            "GROQ_API_KEY ortam değişkeni ayarlanmamış. Lütfen .env dosyanıza GROQ_API_KEY ekleyin."
        )

    base_url = os.getenv("GROQ_BASE_URL", "https://api.groq.com/openai/v1")
    model = os.getenv("GROQ_CLASSIFY_MODEL", "openai/gpt-oss-20b")

    client = instructor.from_openai(
        OpenAI(api_key=api_key, base_url=base_url),
        mode=instructor.Mode.JSON,
    )
    return client, model


def classify_paper(parsed_doc: ParsedDocument) -> PaperProfile:
    """ParsedDocument nesnesini Groq (Llama 3.3 70B) ile analiz ederek PaperProfile çıkarır.

    Düşük token maliyetiyle tek seferlik LLM çağrısı yapar. Başarısızlık durumunda
    sessizce varsayılan değer dönmez, açık bir exception fırlatır.

    Args:
        parsed_doc: Ayrıştırılmış doküman.

    Returns:
        PaperProfile: 17 bağımsız ikili flag, birincil alan ve güven skoru içeren nesne.
    """
    input_text = build_classification_input(parsed_doc)
    client, model_name = get_instructor_client()

    system_prompt = (
        "You are an expert scientific paper classifier specializing in Mathematics, Machine Learning, "
        "Artificial Intelligence, and Data Science research. Analyze the provided document outline, "
        "abstract/first section, and formula metrics to determine all applicable independent binary content flags "
        "and primary research domain in the exact structured schema."
    )

    from app.services.rate_limiter import execute_with_retry

    try:
        profile: PaperProfile = execute_with_retry(
            client.chat.completions.create,
            model=model_name,
            response_model=PaperProfile,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Analyze this paper structure and classify it:\n\n{input_text}"},
            ],
            temperature=0.1,
            max_retries=5,
        )

        # Token kullanımını logla
        log_llm_call(
            LLMCallLog(
                call_type="classification",
                model=model_name,
                input_tokens=0,
                output_tokens=0,
            )
        )

        return profile
    except Exception as e:
        raise RuntimeError(f"PaperProfile sınıflandırma hatası ({model_name}): {str(e)}") from e
