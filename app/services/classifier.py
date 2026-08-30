import os
from typing import Any
import instructor
from openai import OpenAI

from app.models.document import ParsedDocument
from app.models.paper_profile import PaperProfile


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
    """Ortam değişkenlerine göre yapılandırılmış Instructor istemcisi ve model adını döner.

    Returns:
        tuple[Any, str]: (instructor_client, model_name)
    """
    provider = os.getenv("LLM_PROVIDER", "ollama").lower().strip()

    if provider == "openai":
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY ortam değişkeni ayarlanmamış.")
        model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
        client = instructor.from_openai(OpenAI(api_key=api_key))
        return client, model

    elif provider == "anthropic":
        try:
            from anthropic import Anthropic
        except ImportError:
            raise ImportError("Anthropic sağlayıcısı için 'anthropic' paketi kurulu olmalıdır.")
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            raise ValueError("ANTHROPIC_API_KEY ortam değişkeni ayarlanmamış.")
        model = os.getenv("ANTHROPIC_MODEL", "claude-3-5-haiku-latest")
        client = instructor.from_anthropic(Anthropic(api_key=api_key))
        return client, model

    else:
        # Default: Ollama (OpenAI compatible endpoint)
        base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434").rstrip("/")
        if not base_url.endswith("/v1"):
            base_url = f"{base_url}/v1"
        model = os.getenv("OLLAMA_MODEL", "llama3.2")
        client = instructor.from_openai(
            OpenAI(base_url=base_url, api_key="ollama"),
            mode=instructor.Mode.JSON,
        )
        return client, model


def classify_paper(parsed_doc: ParsedDocument) -> PaperProfile:
    """ParsedDocument nesnesini analiz ederek makale profilini (PaperProfile) çıkarır.

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

    try:
        profile: PaperProfile = client.chat.completions.create(
            model=model_name,
            response_model=PaperProfile,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Analyze this paper structure and classify it:\n\n{input_text}"},
            ],
            temperature=0.1,
        )
        return profile
    except Exception as e:
        raise RuntimeError(f"PaperProfile sınıflandırma hatası ({model_name}): {str(e)}") from e
