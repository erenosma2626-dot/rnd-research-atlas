"""Diyagram üretimine uygun bölüm grupları ve diyagram tipleri eşlemesi."""

DIAGRAM_ELIGIBLE_GROUPS = {
    "method_steps": "flowchart",  # pipeline / akış diyagramı
    "system_architecture": "flowchart",  # sistem mimarisi kutuları
    "algorithm_section": "flowchart",  # algoritma akışı
    "survey_taxonomy": "tree",  # taksonomi ağacı
    "optimization_formulation": "flowchart",  # optimizasyon akışı
    "decision_tree": "flowchart_decision",  # karar ağacı / karar düğümleri (diamond)
}


def is_diagram_eligible(group_id: str) -> bool:
    """Belirtilen bölüm grubunun diyagram üretimine uygun olup olmadığını döner."""
    return group_id in DIAGRAM_ELIGIBLE_GROUPS

