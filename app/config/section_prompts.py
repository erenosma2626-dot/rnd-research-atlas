"""Section bazlı prompt şablonları ve beklenen içerik tipleri."""
import os

LANGUAGE_INSTRUCTION = os.getenv(
    "REPORT_LANGUAGE_INSTRUCTION",
    "ÖNEMLİ: Cevabını SADECE TÜRKÇE olarak ver. İngilizce kelime/cümle "
    "kullanma (teknik terimler ve özel isimler hariç, örn. 'GAN', 'diffusion "
    "model', 'transformer' gibi yerleşik terimler olduğu gibi kalabilir, ama açıklama "
    "cümlelerinin tamamı akıcı Türkçe olmalı)."
)

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
            "Her teoremi ayrı bir liste öğesi yap. Matematiksel ifadeleri $...$ veya $$...$$ içine al."
        ),
    },
    "optimization_formulation": {
        "content_type": "prose",
        "instruction": (
            "Optimizasyon problemini formüle et: objective function, "
            "constraints, ve çözüm yöntemi. LaTeX formatında formülleri "
            "çift dolar işareti ($$...$$) veya tek dolar ($...$) ile ver."
        ),
    },
    "algorithm_section": {
        "content_type": "list",
        "instruction": (
            "Algoritmanın adımlarını sırayla listele. Varsa zaman/uzay "
            "karmaşıklığı analizini son maddede belirt. Matematiksel sembolleri LaTeX ile göster."
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
    "decision_tree": {
        "content_type": "list",
        "instruction": (
            "Makaledeki karar mekanizmasını, problem türüne göre yöntem seçim adımlarını "
            "veya yol haritasını (roadmap) adım adım karar noktaları (Evet/Hayır veya Koşul -> Önerilen Yöntem) "
            "halinde listele."
        ),
    },
    "quantitative_results": {
        "content_type": "chart",
        "instruction": (
            "Makaledeki en kapsamlı karşılaştırmalı sayısal sonuçları (modeller/yöntemler ve metrik değerleri) "
            "özetle. Eğer net sayısal metrik verisi yoksa belirt."
        ),
    },
}


def build_prompt(group_id: str) -> str:
    """Belirtilen group_id için dil talimatıyla zenginleştirilmiş sistem promptunu üretir."""
    prompt_config = SECTION_PROMPTS.get(group_id)
    if not prompt_config:
        return f"{LANGUAGE_INSTRUCTION}\n\nBu bölüm için makaleden ilgili bilgileri özetle."
    return f"{LANGUAGE_INSTRUCTION}\n\n{prompt_config['instruction']}"
