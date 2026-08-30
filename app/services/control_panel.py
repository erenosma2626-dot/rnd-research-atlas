from typing import Optional
from app.config.diagram_eligibility import DIAGRAM_ELIGIBLE_GROUPS
from app.models.report_section import FilledSection
from app.models.section_candidate import ControlPanelState, SectionCandidate


def generate_content_preview(filled_section: FilledSection) -> str:
    """FilledSection içeriğinden LLM çağrısı yapmadan hızlı ve deterministik bir önizleme metni üretir.

    Args:
        filled_section: Doldurulmuş bölüm nesnesi.

    Returns:
        str: Kısa önizleme metni.
    """
    content = filled_section.content
    c_type = filled_section.content_type

    if c_type == "prose":
        text = str(content.get("text", "")).strip()
        if len(text) > 150:
            return text[:147] + "..."
        return text or "(Boş metin)"

    elif c_type == "table":
        cols = content.get("columns", [])
        rows = content.get("rows", [])
        col_preview = ", ".join(cols[:3]) if cols else "Kolon yok"
        return f"Tablo: {len(rows)} satır, {len(cols)} sütun ({col_preview})"

    elif c_type == "list":
        items = content.get("items", [])
        first_item = str(items[0]).strip() if items else "Madde yok"
        if len(first_item) > 60:
            first_item = first_item[:57] + "..."
        return f"Liste ({len(items)} madde): {first_item}"

    elif c_type == "error":
        err_msg = str(content.get("error", "Bilinmeyen hata")).strip()
        if len(err_msg) > 100:
            err_msg = err_msg[:97] + "..."
        return f"Hata: {err_msg}"

    else:
        raw_str = str(content).strip()
        return raw_str[:147] + "..." if len(raw_str) > 150 else raw_str


def build_control_panel_state(
    document_id: str,
    filled_sections: list[FilledSection],
) -> ControlPanelState:
    """Doldurulmuş bölümleri kontrol paneli aday listesine dönüştürür.

    Args:
        document_id: Döküman kimliği.
        filled_sections: Doldurulmuş bölümler listesi.

    Returns:
        ControlPanelState: Kontrol paneli durum nesnesi.
    """
    candidates: list[SectionCandidate] = []

    for idx, sec in enumerate(filled_sections):
        section_id = sec.group_id
        is_diagram_eligible = section_id in DIAGRAM_ELIGIBLE_GROUPS
        preview = generate_content_preview(sec)

        candidates.append(
            SectionCandidate(
                section_id=section_id,
                section_title=sec.title,
                detected=True,
                included=True,
                order=idx,
                diagram_available=is_diagram_eligible,
                diagram_included=True if is_diagram_eligible else sec.diagram_requested,
                content_preview=preview,
            )
        )

    return ControlPanelState(
        document_id=document_id,
        candidates=candidates,
    )


def apply_control_panel_changes(
    document_id: str,
    updated_candidates: list[SectionCandidate],
) -> ControlPanelState:
    """Kullanıcının kontrol panelinde yaptığı seçimleri ve sıralamayı doğrular.

    Args:
        document_id: Döküman kimliği.
        updated_candidates: Kullanıcı tarafından güncellenen aday bölüm listesi.

    Returns:
        ControlPanelState: Güncellenmiş kontrol paneli durumu.
    """
    return ControlPanelState(
        document_id=document_id,
        candidates=updated_candidates,
    )


def build_final_report(
    document_id: str,
    filled_sections: list[FilledSection],
    control_panel_state: ControlPanelState,
) -> list[FilledSection]:
    """Kontrol paneli durumuna göre bölümleri filtreler, sıralar ve diyagram bayraklarını işler.

    - included=False olan bölümler rapordan çıkarılır.
    - Kalan bölümler 'order' alanına göre sıralanır.
    - diagram_included=True olan bölümler için 'diagram_requested' flag'i True yapılır.

    Args:
        document_id: Döküman kimliği.
        filled_sections: Orijinal doldurulmuş bölümler.
        control_panel_state: Kullanıcı seçimlerini içeren kontrol paneli durumu.

    Returns:
        list[FilledSection]: Nihai, sıralanmış ve filtrelenmiş rapor bölümleri.
    """
    section_map = {sec.group_id: sec for sec in filled_sections}

    # Sadece included=True olanları al ve order'a göre sırala
    active_candidates = [c for c in control_panel_state.candidates if c.included]
    active_candidates.sort(key=lambda c: c.order)

    final_sections: list[FilledSection] = []
    for candidate in active_candidates:
        orig_sec = section_map.get(candidate.section_id)
        if orig_sec:
            updated_sec = orig_sec.model_copy(
                update={"diagram_requested": candidate.diagram_included}
            )
            final_sections.append(updated_sec)

    return final_sections
