"""Section bazlı prompt şablonları ve beklenen içerik tipleri."""
import os

LANGUAGE_INSTRUCTION = os.getenv(
    "REPORT_LANGUAGE_INSTRUCTION",
    "ÖNEMLİ: Cevabını SADECE TÜRKÇE olarak ver. İngilizce kelime/cümle "
    "kullanma (teknik terimler ve özel isimler hariç, örn. 'GAN', 'diffusion "
    "model', 'transformer' gibi yerleşik terimler olduğu gibi kalabilir, ama açıklama "
    "cümlelerinin tamamı akıcı Türkçe olmalı)."
)

MATH_NOTATION_INSTRUCTION = (
    "Herhangi bir matematiksel değişken, alt simge, üst simge, Yunan harfi "
    "veya denklem geçiyorsa, MUTLAKA tek dolar işareti ile LaTeX formatında "
    "yaz (örn. $x_i$, $\alpha$, $k^*$). Çıplak unicode matematik sembolü "
    "(örn. 'Sαω' gibi) ASLA kullanma."
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
        "content_type": "module_list",
        "instruction": (
            "Sistemin bileşenlerini/modüllerini SIRAYLA listele. Her modül için: "
            "1) modülün adı (varsa orijinal İngilizce adını short_label'a koy), "
            "2) o modülün ne yaptığını 1-2 cümlede açıkla. "
            "Matematiksel değişken/ifade geçiyorsa (örn. alt simge, üst simge, "
            "Yunan harfi, denklem referansı) MUTLAKA tek dolar işaretiyle "
            "LaTeX formatında yaz, örn: $S_{\alpha\omega}(x_i)$, $k^*$, $C_m$. "
            "Düz metin içinde alt simge/üst simge/Yunan harfi ASLA çıplak "
            "unicode olarak yazma (örn. 'Sαω(x_i)' YANLIŞ, '$S_{\alpha\omega}(x_i)$' DOĞRU). "
            "Ayrıca modüller arası veri akışını tek satırlık bir özet olarak "
            "flow_summary alanına yaz (örn. 'IN → Noise Processing → ... → OUT')."
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
    """Merkezi prompt oluşturucu: Dil ve Matematik kurallarını tüm promptlara enjekte eder."""
    raw = SECTION_PROMPTS.get(group_id, {}).get("instruction", "")
    if not raw:
        return f"{LANGUAGE_INSTRUCTION}\n\n{MATH_NOTATION_INSTRUCTION}\n\nBu bölüm için makaleden ilgili bilgileri özetle."
    return f"{raw}\n\n{LANGUAGE_INSTRUCTION}\n\n{MATH_NOTATION_INSTRUCTION}"
