import logging
import re
from typing import Optional
from pydantic import BaseModel, Field

from app.models.document import ParsedDocument
from app.models.figure import ExtractedFigure
from app.models.paper_profile import PaperProfile
from app.models.routing import ActiveSectionGroup
from app.services.slot_filler import call_llm_structured

logger = logging.getLogger("narrative_outline")


class NarrativeSection(BaseModel):
    """Makalenin doğal akışına göre oluşturulmuş adaptif anlatı birimi."""

    outline_id: str = Field(..., description="Benzersiz kısa slug/kimlik (örn: 'knn_gurultu_temizleme')")
    title: str = Field(..., description="Doğal, makaleye özgü Türkçe başlık (örn: 'K-NN ile Gürültü Temizleme')")
    category: str = Field(
        ...,
        description="SECTION_GROUPS'taki karşılık gelen grup kimliği (örn: 'system_architecture', 'method_steps')",
    )
    source_docling_sections: list[str] = Field(
        default_factory=list,
        description="Bu anlatı biriminin beslendiği ham Docling section başlıkları",
    )
    order: int = Field(..., description="Makalenin akışındaki doğal sıra (1, 2, ...)")
    planning_description: Optional[str] = Field(
        default=None, description="Planlama aşaması için kısa açıklama"
    )


class NarrativeOutlineResponse(BaseModel):
    """LLM adaptif anlatı taslağı çıktısı."""

    sections: list[NarrativeSection] = Field(
        ..., description="Makalenin doğal akışını temsil eden sıralı anlatı birimleri"
    )


def generate_narrative_outline(
    parsed_doc: ParsedDocument,
    paper_profile: PaperProfile,
    active_groups: list[ActiveSectionGroup],
) -> list[NarrativeSection]:
    """Makalenin ham Docling başlıklarını ve yapısını inceleyerek doğal, adaptif bir anlatı taslağı üretir.

    Sabit katalog kutuları yerine makalenin kendi akışına uygun 4-10 adet
    anlatı birimi (NarrativeSection) oluşturur.
    """
    # 1. Ham Docling section özetlerini hazırla
    doc_sections_summary = []
    for s in parsed_doc.sections:
        raw_text = getattr(s, "text", getattr(s, "content", "")) or ""
        preview = raw_text[:180].replace("\n", " ").strip()
        doc_sections_summary.append(
            f"- Başlık: \"{s.title}\" (Sayfa {s.page_start}-{s.page_end}) -> Özet: {preview}"
        )
    sections_text = "\n".join(doc_sections_summary[:25])

    # 2. Geçerli kategoriler
    valid_categories = [g.group_id for g in active_groups if g.group_id != "paper_figures"]
    if not valid_categories:
        valid_categories = ["core_summary", "method_steps", "system_architecture", "ml_experiment_table", "quantitative_results", "limitations_future"]

    system_prompt = (
        "Sen uzman bir bilimsel makale anlatıcısısın. Görevin, bir araştırmacının bu makaleyi adım adım, "
        "kendi doğal akışını ve mantıksal mimarisini takip ederek dinleyebileceği 4 ila 10 adet "
        "ANLATI BİRİMİ (NarrativeSection) tasarlamaktır.\n\n"
        "Kurallar:\n"
        "1. Her anlatı biriminin başlığı (title) jenerik değil, makalenin kendi terminolojisiyle TÜRKÇE olmalı "
        "(örn: 'K-NN Tabanlı Gürültü Temizleme ve Özellik Seçimi').\n"
        "2. Her birim için 'category' alanı MUTLAKA şu geçerli kategorilerden biri olmalı: "
        f"{', '.join(valid_categories)}.\n"
        "3. Bir kategori (özellikle 'system_architecture' veya 'method_steps') makale onu birden fazla modülde "
        "anlatıyorsa BİRDEN FAZLA anlatı birimine bölünebilir.\n"
        "4. 'source_docling_sections' listesine, o anlatı biriminin beslendiği ham Docling başlıklarını tam olarak yaz.\n"
        "5. Sıralama (order) 1'den başlayıp makalenin akışını takip etmeli."
    )

    domain_label = getattr(paper_profile, "primary_domain", getattr(paper_profile, "domain", "General Science"))
    user_prompt = (
        f"MAKALE BİRİNCİL ALANI: {domain_label}\n\n"
        f"HAM DOKÜMAN BÖLÜM VE SAYFA YAPISI:\n{sections_text}\n\n"
        f"KULLANILABİLİR KATEGORİ HAVUZU:\n{', '.join(valid_categories)}\n\n"
        "Bu makaleyi en anlaşılır, modüler ve doğal akışta sunacak NarrativeOutlineResponse JSON listesini üret."
    )

    try:
        raw_result: NarrativeOutlineResponse = call_llm_structured(
            prompt=user_prompt,
            response_model=NarrativeOutlineResponse,
            system_prompt=system_prompt,
            group_id="system_architecture",
            call_type="narrative_outline",
        )

        if raw_result.sections and len(raw_result.sections) >= 3:
            # Sıralamayı garantiye al
            for idx, sec in enumerate(raw_result.sections):
                sec.order = idx + 1
                if not sec.category or sec.category not in valid_categories:
                    sec.category = valid_categories[min(idx, len(valid_categories) - 1)]
            logger.info(f"Adaptif anlatı taslağı oluşturuldu: {len(raw_result.sections)} bölüm")
            return raw_result.sections

    except Exception as e:
        logger.warning(f"Adaptif anlatı taslağı üretilirken hata, statik fallback uygulanıyor: {e}")

    # Fallback: Mevcut active_groups'tan türet
    fallback_sections: list[NarrativeSection] = []
    for idx, g in enumerate(active_groups):
        if g.group_id == "paper_figures":
            continue
        fallback_sections.append(
            NarrativeSection(
                outline_id=g.group_id,
                title=g.title,
                category=g.group_id,
                source_docling_sections=[g.title],
                order=idx + 1,
                planning_description=f"{g.title} analizi",
            )
        )
    return fallback_sections


def assign_figures_to_narrative(
    figures: list[ExtractedFigure],
    narrative_sections: list[NarrativeSection],
    parsed_doc: Optional[ParsedDocument] = None,
) -> dict[str, list[ExtractedFigure]]:
    """Gömülü PDF figürlerini sayfa aralıklarına göre en ilgili anlatı birimine bağlamsal olarak atar.

    Hiçbir figür kaybolmaz; eşleşmeyenler en yakın veya ilk bölüme atanır.
    """
    assigned: dict[str, list[ExtractedFigure]] = {s.outline_id: [] for s in narrative_sections}
    if not figures or not narrative_sections:
        return assigned

    # parsed_doc yoksa veya section bulunamazsa tüm figürleri ilk bölüme bağla
    if not parsed_doc or not parsed_doc.sections:
        first_id = narrative_sections[0].outline_id
        assigned[first_id].extend(figures)
        return assigned

    # 1. Her Docling section için sayfa aralığı haritası çıkar
    docling_page_map = []
    for s in parsed_doc.sections:
        docling_page_map.append({
            "title": s.title.strip().lower(),
            "start": s.page_start,
            "end": s.page_end,
        })

    # 2. Her NarrativeSection'ın kapsadığı sayfa aralıklarını belirle
    narrative_page_ranges: list[dict] = []
    for n_sec in narrative_sections:
        sec_sources = [src.strip().lower() for src in n_sec.source_docling_sections]
        pages = []
        for d_map in docling_page_map:
            if any(src in d_map["title"] or d_map["title"] in src for src in sec_sources):
                pages.extend(range(d_map["start"], d_map["end"] + 1))
        
        min_p = min(pages) if pages else None
        max_p = max(pages) if pages else None
        narrative_page_ranges.append({
            "outline_id": n_sec.outline_id,
            "min_page": min_p,
            "max_page": max_p,
        })

    # 3. Figürleri eşleştir
    for fig in figures:
        fig_page = fig.page
        matched_outline_id = None

        # Sayfa aralığına tam oturan narrative section var mı?
        for n_range in narrative_page_ranges:
            if n_range["min_page"] and n_range["max_page"]:
                if n_range["min_page"] <= fig_page <= n_range["max_page"]:
                    matched_outline_id = n_range["outline_id"]
                    break

        # Bulunamadıysa en yakın narrative section'ı bul
        if not matched_outline_id:
            # En yakın sayfa mesafesini hesapla
            best_diff = float("inf")
            best_id = narrative_sections[0].outline_id
            for n_range in narrative_page_ranges:
                if n_range["min_page"]:
                    diff = abs(n_range["min_page"] - fig_page)
                    if diff < best_diff:
                        best_diff = diff
                        best_id = n_range["outline_id"]
            matched_outline_id = best_id

        assigned[matched_outline_id].append(fig)

    return assigned
