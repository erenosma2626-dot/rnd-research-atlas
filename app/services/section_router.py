from app.config.section_schema import SECTION_GROUPS
from app.models.paper_profile import PaperProfile
from app.models.routing import ActiveSectionGroup


def route_sections(paper_profile: PaperProfile) -> list[ActiveSectionGroup]:
    """PaperProfile içerisindeki bayraklara göre aktifleşecek rapor bölüm gruplarını belirler.

    - always_active=True olan bölüm grupları her zaman dahil edilir.
    - trigger_mode="any" için trigger_flags içerisindeki bayraklardan en az biri True ise grup aktifleşir.
    - Sıralama SECTION_GROUPS konfigürasyonundaki sırayı korur.
    - Saf (pure) fonksiyondur, yan etkisi yoktur.

    Args:
        paper_profile: Makalenin sınıflandırılmış profili.

    Returns:
        list[ActiveSectionGroup]: Aktifleşen bölüm gruplarının sıralı listesi.
    """
    active_groups: list[ActiveSectionGroup] = []
    profile_dict = paper_profile.model_dump()

    for group in SECTION_GROUPS:
        group_id = group["group_id"]
        title = group["title"]
        always_active = group.get("always_active", False)
        trigger_flags = group.get("trigger_flags", [])

        if always_active:
            active_groups.append(
                ActiveSectionGroup(
                    group_id=group_id,
                    title=title,
                    matched_flags=[],
                )
            )
        else:
            # Tetikleyici bayraklardan aktif olanları bul
            matched = [flag for flag in trigger_flags if profile_dict.get(flag, False) is True]
            if matched:
                active_groups.append(
                    ActiveSectionGroup(
                        group_id=group_id,
                        title=title,
                        matched_flags=matched,
                    )
                )

    return active_groups
