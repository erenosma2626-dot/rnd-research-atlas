"""Diyagram üretimine uygun bölüm grupları ve diyagram tipleri eşlemesi."""

DIAGRAM_ELIGIBLE_GROUPS = {
    "method_steps": "flowchart",  # pipeline / akış diyagramı
    "system_architecture": "flowchart",  # sistem mimarisi kutuları
    "algorithm_section": "flowchart",  # algoritma akışı
    "survey_taxonomy": "tree",  # taksonomi ağacı
    "optimization_formulation": "flowchart",  # optimizasyon akışı
}
