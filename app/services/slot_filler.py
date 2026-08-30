from typing import Any, Optional
from pydantic import BaseModel, Field

from app.config.section_prompts import SECTION_PROMPTS
from app.models.document import ParsedDocument
from app.models.formula import ExtractedFormula
from app.models.paper_profile import PaperProfile
from app.models.report_section import FilledSection, SourceReference
from app.models.routing import ActiveSectionGroup
from app.services.classifier import LLMCallLog, get_instructor_client, log_llm_call
from app.services.vector_store import query_document


class ProseContent(BaseModel):
    """Düz metin (prose) çıktısı için şema."""

    text: str = Field(..., description="Teknik ve detaylı açıklama metni")


class TableContent(BaseModel):
    """Tablo (table) çıktısı için şema."""

    columns: list[str] = Field(..., description="Tablo sütun başlıkları")
    rows: list[list[str]] = Field(..., description="Tablo satır değerleri")


class ListContent(BaseModel):
    """Liste (list) çıktısı için şema."""

    items: list[str] = Field(..., description="Madde madde liste elemanları")


def get_response_model_for_type(content_type: str) -> type[BaseModel]:
    """İçerik tipine göre uygun Pydantic modelini döner."""
    if content_type == "table":
        return TableContent
    elif content_type == "list":
        return ListContent
    else:
        return ProseContent


def fill_section(
    document_id: str,
    group: ActiveSectionGroup,
    parsed_doc: ParsedDocument,
    extracted_formulas: Optional[list[ExtractedFormula]] = None,
    paper_profile: Optional[PaperProfile] = None,
) -> FilledSection:
    """Belirli bir rapor bölüm grubunun içeriğini ChromaDB retrieval ve LLM ile doldurur.

    - ChromaDB'den ilgili chunk'ları çeker.
    - has_heavy_notation=True veya formüller mevcutsa anahtar formül talimatını ekler.
    - SECTION_PROMPTS konfigürasyonuna göre Groq üzerinden yapılandırılmış çıktı ister.
    - Hata oluştuğunda tüm akışı çökertmez, error tipiyle döner.

    Args:
        document_id: Vektör veritabanındaki döküman ID.
        group: Doldurulacak aktif bölüm grubu.
        parsed_doc: Orijinal ayrıştırılmış döküman nesnesi.
        extracted_formulas: Çıkarılan LaTeX formülleri listesi.
        paper_profile: Makale profili.

    Returns:
        FilledSection: Doldurulmuş bölüm nesnesi.
    """
    prompt_cfg = SECTION_PROMPTS.get(
        group.group_id,
        {
            "content_type": "prose",
            "instruction": f"{group.title} konusundaki detayları ve analizleri özetle.",
        },
    )
    content_type = prompt_cfg["content_type"]
    instruction = prompt_cfg["instruction"]
    response_model = get_response_model_for_type(content_type)

    # 1. Retrieval
    query_text = f"{group.title} {instruction}"
    retrieved_chunks = query_document(
        document_id=document_id,
        query=query_text,
        n_results=4,
    )

    # Kaynak referanslarını topla
    sources: list[SourceReference] = []
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
            sources.append(SourceReference(page=page, section_title=sec_title))

    # Eğer retrieval boş döndüyse fallback olarak doküman özetini kullan
    if not context_blocks:
        context_text = parsed_doc.raw_markdown[:4000]
        sources.append(SourceReference(page=1, section_title="Document Overview"))
    else:
        context_text = "\n\n---\n\n".join(context_blocks)

    # Formül zenginleştirmesi (has_heavy_notation veya formül listesi varsa)
    formula_context = ""
    has_heavy = paper_profile.has_heavy_notation if paper_profile else False
    if extracted_formulas and (has_heavy or group.group_id in ["optimization_formulation", "method_steps"]):
        valid_formulas = [f for f in extracted_formulas if f.latex_code]
        if valid_formulas:
            formula_lines = []
            for f in valid_formulas[:5]:
                conf_str = "(doğruluğu teyit edilmemiş)" if f.low_confidence else ""
                formula_lines.append(f"- Sayfa {f.page}: $${f.latex_code}$$ {conf_str}")
            formula_context = (
                "\n\n--- ÇEVRİLMİŞ LATEX FORMÜLLERİ ---\n"
                + "\n".join(formula_lines)
                + "\nTalimat: Bu section için, yukarıda verilen çevrilmiş LaTeX formüllerinden (varsa) "
                "en önemli 1-3 tanesini 'Anahtar Formüller' başlığı altında, sayfa referansıyla birlikte ekle. "
                "Sadece low_confidence=False olan formülleri öncelikle kullan; low_confidence=True olanları "
                "sadece başka seçenek yoksa ve mutlaka belirtmen gerekiyorsa kullan, kullanırsan '(doğruluğu teyit edilmemiş)' notu ekle.\n"
            )

    # 2. LLM Call
    client, model_name = get_instructor_client()
    system_prompt = (
        "You are an expert scientific paper analyzer. Your job is to extract and generate "
        "accurate, highly technical, and concise report sections from the provided document context. "
        "Strictly adhere to the requested output schema and language instructions."
    )

    user_prompt = (
        f"SECTION TITLE: {group.title}\n"
        f"INSTRUCTION: {instruction}\n\n"
        f"DOCUMENT RELEVANT CONTEXT:\n{context_text}\n"
        f"{formula_context}\n"
        f"Generate the exact structured content for this section."
    )

    try:
        raw_result = client.chat.completions.create(
            model=model_name,
            response_model=response_model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.1,
        )

        # Log LLM Call
        log_llm_call(
            LLMCallLog(
                call_type="slot_fill",
                model=model_name,
                input_tokens=0,
                output_tokens=0,
            )
        )

        content_dict = raw_result.model_dump()
        return FilledSection(
            group_id=group.group_id,
            title=group.title,
            content_type=content_type,
            content=content_dict,
            sources=sources,
        )
    except Exception as e:
        # Hata izolasyonu: Bu bölümün hatası tüm raporu engellemez
        return FilledSection(
            group_id=group.group_id,
            title=group.title,
            content_type="error",
            content={"error": f"Bölüm içeriği üretilirken hata oluştu: {str(e)}"},
            sources=sources,
        )


def fill_all_sections(
    document_id: str,
    active_groups: list[ActiveSectionGroup],
    parsed_doc: ParsedDocument,
    extracted_formulas: Optional[list[ExtractedFormula]] = None,
    paper_profile: Optional[PaperProfile] = None,
) -> list[FilledSection]:
    """Tüm aktif bölüm grupları için içerik üretir.

    Args:
        document_id: Döküman kimliği.
        active_groups: Aktif rapor bölümleri listesi.
        parsed_doc: Ayrıştırılmış döküman nesnesi.
        extracted_formulas: Çıkarılan formüller listesi.
        paper_profile: Makale profili.

    Returns:
        list[FilledSection]: Doldurulmuş rapor bölümleri listesi.
    """
    filled_sections: list[FilledSection] = []
    for group in active_groups:
        filled_sec = fill_section(
            document_id=document_id,
            group=group,
            parsed_doc=parsed_doc,
            extracted_formulas=extracted_formulas,
            paper_profile=paper_profile,
        )
        filled_sections.append(filled_sec)
    return filled_sections
