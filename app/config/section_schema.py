"""Flag → Section Grup Eşleme Konfigürasyonu."""

SECTION_GROUPS = [
    {
        "group_id": "core_summary",
        "title": "Özet ve Katkı",
        "always_active": True,  # Her makalede olur, flag gerektirmez
        "trigger_flags": [],
    },
    {
        "group_id": "method_steps",
        "title": "Yöntem",
        "always_active": True,
        "trigger_flags": [],
    },
    {
        "group_id": "ml_experiment_table",
        "title": "Veri & Yöntem (ML)",
        "always_active": False,
        "trigger_flags": [
            "has_dataset",
            "has_preprocessing_pipeline",
            "has_ml_experiment",
            "has_hyperparameter_tuning",
            "has_evaluation_metrics",
            "has_baseline_comparison",
        ],
        "trigger_mode": "any",  # Bu flag'lerden EN AZ BİRİ true ise grup aktif olur
    },
    {
        "group_id": "theorem_proofs",
        "title": "Teoremler",
        "always_active": False,
        "trigger_flags": ["has_theorem_proof"],
        "trigger_mode": "any",
    },
    {
        "group_id": "optimization_formulation",
        "title": "Optimizasyon Formülasyonu",
        "always_active": False,
        "trigger_flags": ["has_optimization_formulation"],
        "trigger_mode": "any",
    },
    {
        "group_id": "algorithm_section",
        "title": "Algoritma",
        "always_active": False,
        "trigger_flags": ["has_algorithm_pseudocode", "has_complexity_analysis"],
        "trigger_mode": "any",
    },
    {
        "group_id": "system_architecture",
        "title": "Sistem Mimarisi",
        "always_active": False,
        "trigger_flags": ["has_system_architecture"],
        "trigger_mode": "any",
    },
    {
        "group_id": "survey_taxonomy",
        "title": "Taksonomi / Karşılaştırma",
        "always_active": False,
        "trigger_flags": ["has_survey_structure"],
        "trigger_mode": "any",
    },
    {
        "group_id": "ablation_study",
        "title": "Ablation Çalışması",
        "always_active": False,
        "trigger_flags": ["has_ablation_study"],
        "trigger_mode": "any",
    },
    {
        "group_id": "limitations_future",
        "title": "Sınırlamalar ve Gelecek Çalışmalar",
        "always_active": False,
        "trigger_flags": ["has_limitations_section", "has_future_work"],
        "trigger_mode": "any",
    },
]
