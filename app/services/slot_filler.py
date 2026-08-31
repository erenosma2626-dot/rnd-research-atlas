import logging
from typing import Any, Optional
from pydantic import BaseModel, Field

from app.config.section_prompts import (
    LANGUAGE_INSTRUCTION,
    MATH_NOTATION_INSTRUCTION,
    SECTION_PROMPTS,
    build_prompt,
)
from app.models.chart_data import ChartData, ChartSeries
from app.models.document import ParsedDocument
from app.models.figure import ExtractedFigure
from app.models.formula import ExtractedFormula
from app.models.paper_profile import PaperProfile
from app.models.report_section import FilledSection, ModuleListContent, SourceReference
from app.models.routing import ActiveSectionGroup
from app.services.classifier import LLMCallLog, get_instructor_client, log_llm_call
from app.services.rate_limiter import execute_with_retry
from app.services.vector_store import query_document
from app.storage.object_store import get_presigned_url

logger = logging.getLogger("slot_filler")


MAX_TOKENS_BY_GROUP = {
    "ml_experiment_table": 2500,
    "survey_taxonomy": 2000,
    "ablation_study": 2000,
    "core_summary": 1200,
    "method_steps": 1200,
    "system_architecture": 1800,
    "optimization_formulation": 1500,
    "decision_tree": 1500,
    "theorem_proofs": 1500,
    "quantitative_results": 2000,
    "limitations_future": 1200,
}


def call_llm_structured(
    prompt: str,
    response_model: type[BaseModel],
    system_prompt: Optional[str] = None,
    group_id: Optional[str] = None,
    max_tokens: Optional[int] = None,
    temperature: float = 0.1,
    call_type: str = "slot_fill",
) -> BaseModel:
    """TÜM structured-output LLM çağrılarının geçtiği merkezi gateway.

    Dil zorunluluğu (Türkçe) ve LaTeX notasyon kuralları burada otomatik
    olarak her prompt'un başına eklenir; token limiti grup bazında belirlenir.
    """
    client, model_name = get_instructor_client()

    full_prompt = (
        f"{LANGUAGE_INSTRUCTION}\n\n"
        f"{MATH_NOTATION_INSTRUCTION}\n\n"
        f"{prompt}"
    )

    sys_prompt = system_prompt or (
        "You are an expert scientific paper analyzer. Your job is to extract and generate "
        "accurate, highly technical, and concise report sections STRICTLY IN TURKISH. "
        "Adhere to the requested structured schema, output valid Turkish text with LaTeX $...$ math expressions."
    )

    tokens = max_tokens or (MAX_TOKENS_BY_GROUP.get(group_id, 1600) if group_id else 1600)

    result = execute_with_retry(
        client.chat.completions.create,
        model=model_name,
        response_model=response_model,
        messages=[
            {"role": "system", "content": sys_prompt},
            {"role": "user", "content": full_prompt},
        ],
        temperature=temperature,
        max_tokens=tokens,
        max_retries=5,
    )

    log_llm_call(
        LLMCallLog(
            call_type=call_type,
            model=model_name,
            input_tokens=0,
            output_tokens=0,
        )
    )

    return result


class ProseContent(BaseModel):
    """Düz metin (prose) çıktısı için şema."""

    text: str = Field(..., description="Teknik ve detaylı açıklama metni")
    key_finding: Optional[str] = Field(
        default=None, description="Bu bölüme özgü 1-2 cümlelik öne çıkan bulgu/çıkarım (varsa)"
    )


class TableContent(BaseModel):
    """Tablo (table) çıktısı için şema."""

    columns: list[str] = Field(..., description="Tablo sütun başlıkları")
    rows: list[list[str]] = Field(..., description="Tablo satır değerleri")
    key_finding: Optional[str] = Field(
        default=None, description="Bu bölüme özgü 1-2 cümlelik öne çıkan bulgu/çıkarım (varsa)"
    )


class ListContent(BaseModel):
    """Liste (list) çıktısı için şema."""

    items: list[str] = Field(..., description="Madde madde liste elemanları")
    key_finding: Optional[str] = Field(
        default=None, description="Bu bölüme özgü 1-2 cümlelik öne çıkan bulgu/çıkarım (varsa)"
    )


class ImageGalleryItem(BaseModel):
    """Galeri görsel öğesi."""

    image_url: str
    caption: str
    page: int
    figure_type: str


class ImageGalleryContent(BaseModel):
    """Görsel galerisi çıktısı için şema."""

    images: list[ImageGalleryItem] = Field(default_factory=list)
    key_finding: Optional[str] = Field(default=None, description="Öne çıkan görsel bulgusu")


def get_response_model_for_type(content_type: str) -> type[BaseModel]:
    """İçerik tipine göre uygun Pydantic modelini döner."""
    if content_type == "table":
        return TableContent
    elif content_type == "list":
        return ListContent
    elif content_type == "module_list":
        return ModuleListContent
    elif content_type == "chart":
        return ChartData
    elif content_type == "image_gallery":
        return ImageGalleryContent
    else:
        return ProseContent


def fill_paper_figures_section(figures: list[ExtractedFigure], document_id: str) -> FilledSection:
    """PDF'ten çıkarılan figürleri LLM çağrısı yapmadan doğrudan görsel galerisi section'ına çevirir."""
    images = []
    sources = []
    for fig in figures:
        try:
            # Presigned URL oluştur
            direct_url = get_presigned_url(fig.image_storage_path, expires_seconds=86400)
        except Exception:
            direct_url = fig.image_storage_path

        images.append(
            {
                "image_url": direct_url,
                "caption": fig.caption or f"Şekil (Sayfa {fig.page})",
                "page": fig.page,
                "figure_type": fig.figure_type,
            }
        )
        sources.append(SourceReference(page=fig.page, section_title=fig.caption or "Figür"))

    return FilledSection(
        group_id="paper_figures",
        title="Makale Görselleri & Şemalar",
        content_type="image_gallery",
        content={"images": images},
        sources=sources,
    )


def extract_chart_data(
    document_id: str,
    retrieved_chunks: list[dict[str, Any]],
    parsed_doc: Optional[ParsedDocument] = None,
) -> Optional[ChartData]:
    """Retrieval sonuçlarından sayısal karşılaştırma verilerini çıkararak ChartData üretir.

    Eğer makalede anlamlı sayısal veri yoksa None döner (halüsinasyon engelleme).
    """
    context_text = "\n\n".join(c["content"] for c in retrieved_chunks)
    if not context_text and parsed_doc:
        context_text = parsed_doc.raw_markdown[:5000]

    system_prompt = (
        "You are an expert scientific data extractor. Extract quantitative evaluation results "
        "(models/methods, benchmark metrics, F1/RMSE/Accuracy/Loss values) from the text. "
        "Strictly return structured ChartData with real numbers found in the text in TURKISH. "
        "If there are no clear quantitative comparison tables or numbers, return empty series."
    )
    user_prompt = (
        f"DOCUMENT EXPERIMENT AND RESULT CONTEXT:\n{context_text}\n\n"
        "Extract the representative comparison chart data in Turkish title and labels."
    )

    try:
        raw_result = call_llm_structured(
            prompt=user_prompt,
            response_model=ChartData,
            system_prompt=system_prompt,
            group_id="quantitative_results",
            call_type="chart_data_extract",
        )
        # Eğer anlamlı seri ve etiket yoksa grafik üretme
        if not raw_result.series or not raw_result.x_labels or len(raw_result.series) == 0:
            return None
        # Sayısal değer kontrolü
        if all(len(s.values) == 0 for s in raw_result.series):
            return None

        return raw_result
    except Exception as e:
        logger.warning(f"Sayısal grafik verisi çıkarılırken hata (grafik atlandı): {e}")
        return None


def fill_section(
    document_id: str,
    group: ActiveSectionGroup,
    parsed_doc: Optional[ParsedDocument] = None,
    extracted_formulas: Optional[list[ExtractedFormula]] = None,
    paper_profile: Optional[PaperProfile] = None,
) -> FilledSection:
    """Belirli bir rapor bölüm grubunun içeriğini ChromaDB retrieval ve LLM ile doldurur."""
    prompt_cfg = SECTION_PROMPTS.get(
        group.group_id,
        {
            "content_type": "prose",
            "instruction": f"{group.title} konusundaki detayları ve analizleri özetle.",
        },
    )
    content_type = prompt_cfg["content_type"]
    instruction = build_prompt(group.group_id)

    # 1. Retrieval
    query_text = f"{group.title} {prompt_cfg['instruction']}"
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
        context_text = parsed_doc.raw_markdown[:4000] if parsed_doc else f"{group.title} bölüm içeriği."
        sources.append(SourceReference(page=1, section_title="Document Overview"))
    else:
        context_text = "\n\n---\n\n".join(context_blocks)

    # Özel Durum 1: Sayısal Sonuçlar (Chart)
    if group.group_id == "quantitative_results" or content_type == "chart":
        chart_data = extract_chart_data(document_id, retrieved_chunks, parsed_doc)
        if chart_data:
            return FilledSection(
                group_id=group.group_id,
                title=group.title,
                content_type="chart",
                content=chart_data.model_dump(),
                sources=sources,
            )
        else:
            # Sayısal grafik üretilemediyse tabloya fallback yap
            content_type = "table"

    # Formül zenginleştirmesi
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
                "en önemli 1-3 tanesini 'Anahtar Formüller' başlığı altında, sayfa referansıyla birlikte ekle.\n"
            )

    response_model = get_response_model_for_type(content_type)

    user_prompt = (
        f"SECTION TITLE: {group.title}\n"
        f"INSTRUCTION: {instruction}\n\n"
        f"DOCUMENT RELEVANT CONTEXT:\n{context_text}\n"
        f"{formula_context}\n"
        f"Generate the exact structured content for this section in TURKISH."
    )

    try:
        raw_result = call_llm_structured(
            prompt=user_prompt,
            response_model=response_model,
            group_id=group.group_id,
            call_type="slot_fill",
        )

        content_dict = raw_result.model_dump()
        key_finding = content_dict.pop("key_finding", None) or getattr(raw_result, "key_finding", None)
        return FilledSection(
            group_id=group.group_id,
            title=group.title,
            content_type=content_type,
            content=content_dict,
            key_finding=key_finding,
            sources=sources,
        )
    except Exception as e:
        logger.error(f"Section {group.group_id} generation failed: {e}")
        return FilledSection(
            group_id=group.group_id,
            title=group.title,
            content_type="error",
            content={
                "message": "Bu bölüm oluşturulurken bir hata oluştu. Lütfen yeniden deneyin.",
                "error_details": str(e),
            },
            sources=sources,
        )


def fill_narrative_section(
    narrative: Any,
    document_id: str,
    parsed_doc: Optional[ParsedDocument] = None,
    extracted_formulas: Optional[list[ExtractedFormula]] = None,
    paper_profile: Optional[PaperProfile] = None,
    figures: Optional[list[ExtractedFigure]] = None,
) -> FilledSection:
    """Tek bir adaptif NarrativeSection için içerik üretir."""
    category = getattr(narrative, "category", "system_architecture")
    outline_id = getattr(narrative, "outline_id", category)
    title = getattr(narrative, "title", category)
    order = getattr(narrative, "order", 1)
    source_sections = getattr(narrative, "source_docling_sections", [])

    prompt_cfg = SECTION_PROMPTS.get(
        category,
        {
            "content_type": "prose",
            "instruction": f"{title} konusundaki detayları ve analizleri özetle.",
        },
    )
    content_type = prompt_cfg["content_type"]
    instruction = build_prompt(category)

    # 1. Retrieval
    query_text = f"{title} {' '.join(source_sections)} {prompt_cfg['instruction']}"
    retrieved_chunks = query_document(
        document_id=document_id,
        query=query_text,
        n_results=4,
    )

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

    if not context_blocks:
        context_text = parsed_doc.raw_markdown[:4000] if parsed_doc else f"{title} bölüm içeriği."
        sources.append(SourceReference(page=1, section_title="Document Overview"))
    else:
        context_text = "\n\n---\n\n".join(context_blocks)

    if category == "quantitative_results" or content_type == "chart":
        chart_data = extract_chart_data(document_id, retrieved_chunks, parsed_doc)
        if chart_data:
            return FilledSection(
                group_id=category,
                outline_id=outline_id,
                title=title,
                content_type="chart",
                content=chart_data.model_dump(),
                order=order,
                figures=figures or [],
                key_finding=chart_data.caption,
                sources=sources,
            )
        else:
            content_type = "table"

    formula_context = ""
    has_heavy = paper_profile.has_heavy_notation if paper_profile else False
    if extracted_formulas and (has_heavy or category in ["optimization_formulation", "method_steps"]):
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
                "en önemli 1-3 tanesini 'Anahtar Formüller' başlığı altında, sayfa referansıyla birlikte ekle.\n"
            )

    response_model = get_response_model_for_type(content_type)
    user_prompt = (
        f"SECTION TITLE: {title} (Kategori: {category})\n"
        f"INSTRUCTION: {instruction}\n\n"
        f"DOCUMENT RELEVANT CONTEXT:\n{context_text}\n"
        f"{formula_context}\n"
        f"Generate the exact structured content for this section in TURKISH."
    )

    try:
        raw_result = call_llm_structured(
            prompt=user_prompt,
            response_model=response_model,
            group_id=category,
            call_type="slot_fill",
        )

        content_dict = raw_result.model_dump()
        key_finding = content_dict.pop("key_finding", None) or getattr(raw_result, "key_finding", None)

        return FilledSection(
            group_id=category,
            outline_id=outline_id,
            title=title,
            content_type=content_type,
            content=content_dict,
            order=order,
            figures=figures or [],
            key_finding=key_finding,
            sources=sources,
        )
    except Exception as e:
        logger.error(f"Narrative section {outline_id} ({title}) generation failed: {e}")
        return FilledSection(
            group_id=category,
            outline_id=outline_id,
            title=title,
            content_type="error",
            content={
                "message": "Bu bölüm oluşturulurken bir hata oluştu. Lütfen yeniden deneyin.",
                "error_details": str(e),
            },
            order=order,
            figures=figures or [],
            sources=sources,
        )


def fill_all_sections(
    document_id: str,
    active_groups: list[ActiveSectionGroup],
    parsed_doc: Optional[ParsedDocument] = None,
    extracted_formulas: Optional[list[ExtractedFormula]] = None,
    paper_profile: Optional[PaperProfile] = None,
    narrative_sections: Optional[list[Any]] = None,
    extracted_figures: Optional[list[ExtractedFigure]] = None,
) -> list[FilledSection]:
    """Tüm aktif bölüm grupları veya adaptif anlatı birimleri için içerik üretir."""
    filled_sections: list[FilledSection] = []

    # Adaptif Anlatı Modu (Varsa)
    if narrative_sections and len(narrative_sections) > 0:
        from app.services.narrative_outline import assign_figures_to_narrative

        figs = extracted_figures or (parsed_doc.figures if parsed_doc and hasattr(parsed_doc, "figures") else [])
        figure_assignment = assign_figures_to_narrative(figs, narrative_sections, parsed_doc)

        for n_sec in narrative_sections:
            sec_figs = figure_assignment.get(getattr(n_sec, "outline_id", ""), [])
            filled_sec = fill_narrative_section(
                narrative=n_sec,
                document_id=document_id,
                parsed_doc=parsed_doc,
                extracted_formulas=extracted_formulas,
                paper_profile=paper_profile,
                figures=sec_figs,
            )
            filled_sections.append(filled_sec)

        return filled_sections

    # Standart Mod (Fallback)
    if parsed_doc and hasattr(parsed_doc, "figures") and parsed_doc.figures:
        figures_section = fill_paper_figures_section(parsed_doc.figures, document_id)
        filled_sections.append(figures_section)

    for group in active_groups:
        if group.group_id == "paper_figures":
            continue  # Yukarıda doğrudan dolduruldu
        filled_sec = fill_section(
            document_id=document_id,
            group=group,
            parsed_doc=parsed_doc,
            extracted_formulas=extracted_formulas,
            paper_profile=paper_profile,
        )
        filled_sections.append(filled_sec)

    return filled_sections
