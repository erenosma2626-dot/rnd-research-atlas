"""Section bazlı prompt şablonları ve beklenen içerik tipleri."""

SECTION_PROMPTS = {
    "core_summary": {
        "content_type": "prose",
        "instruction": (
            "Bu makalenin özetini ve ana katkılarını 2-3 paragrafta, "
            "teknik terimleri koruyarak ama gereksiz jargon eklemeden özetle."
        ),
    },
    "method_steps": {
        "content_type": "list",
        "instruction": (
            "Makalenin yöntemini, takip edilebilir adımlara böl. "
            "Her adımı kısa ve net bir cümleyle ifade et. Anahtar terimleri kalın yaz."
        ),
    },
    "ml_experiment_table": {
        "content_type": "table",
        "instruction": (
            "Kullanılan veri seti, ön işleme adımları, model(ler), "
            "hiperparametreler ve değerlendirme metriklerini tek bir tabloda özetle. "
            "Sütunlar: Dataset, Ön İşleme, Model, Hiperparametreler, Metrik, Sonuç."
        ),
    },
    "theorem_proofs": {
        "content_type": "list",
        "instruction": (
            "Makaledeki her teorem/lemma için: [İfade] → [Kanıt stratejisi özeti, "
            "1-2 cümle, TAM İSPAT DEĞİL] → [Bu teoremin makalede nerede kullanıldığı]. "
            "Her teoremi ayrı bir liste öğesi yap."
        ),
    },
    "optimization_formulation": {
        "content_type": "prose",
        "instruction": (
            "Optimizasyon problemini formüle et: objective function, "
            "constraints, ve çözüm yöntemi. Mümkünse LaTeX formatında formül ver "
            "(çift dolar işareti $$....$$ ile)."
        ),
    },
    "algorithm_section": {
        "content_type": "list",
        "instruction": (
            "Algoritmanın adımlarını sırayla listele. Varsa zaman/uzay "
            "karmaşıklığı analizini son maddede belirt."
        ),
    },
    "system_architecture": {
        "content_type": "prose",
        "instruction": (
            "Sistemin bileşenlerini ve aralarındaki veri akışını açıkla. "
            "Bu section ayrıca bir diyagram için de kullanılacak, bu yüzden "
            "bileşenleri net isimlerle ayır."
        ),
    },
    "survey_taxonomy": {
        "content_type": "table",
        "instruction": (
            "Makalenin karşılaştırdığı yöntem/yaklaşımları bir tabloda özetle. "
            "Sütunlar: Yöntem, Temel Fikir, Güçlü Yön, Zayıf Yön."
        ),
    },
    "ablation_study": {
        "content_type": "table",
        "instruction": (
            "Ablation çalışmasının sonuçlarını tabloda özetle. "
            "Sütunlar: Çıkarılan Bileşen, Performans Değişimi, Yorum."
        ),
    },
    "limitations_future": {
        "content_type": "list",
        "instruction": (
            "Yazarın belirttiği sınırlamaları ve gelecek çalışma önerilerini "
            "ayrı ayrı listele."
        ),
    },
}
