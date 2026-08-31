from pydantic import BaseModel, Field
from app.models.document import ParsedDocument


class PaperProfile(BaseModel):
    """Akademik makale veya araştırma raporunun içerik ve yapısal profil bayrakları."""

    # Matematik ekseni
    has_theorem_proof: bool = Field(
        default=False, description="Teorem/lemma/ispat içeriyor mu"
    )
    has_heavy_notation: bool = Field(
        default=False, description="Yoğun matematiksel formülasyon var mı"
    )
    has_algorithm_pseudocode: bool = Field(
        default=False, description="Algoritma/pseudocode bloğu var mı"
    )
    has_complexity_analysis: bool = Field(
        default=False, description="Zaman/uzay karmaşıklığı analizi var mı"
    )
    has_optimization_formulation: bool = Field(
        default=False, description="Optimizasyon problemi (objective+constraints) formüle edilmiş mi"
    )

    # ML/AI/DS ekseni
    has_ml_experiment: bool = Field(
        default=False, description="Model eğitilip test edilmiş mi"
    )
    has_ablation_study: bool = Field(
        default=False, description="Bileşen çıkarma testi var mı"
    )
    has_dataset: bool = Field(
        default=False, description="Belirli bir veri seti kullanılmış mı"
    )
    has_preprocessing_pipeline: bool = Field(
        default=False, description="Veri temizleme/aggregasyon adımları detaylı anlatılmış mı"
    )
    has_hyperparameter_tuning: bool = Field(
        default=False, description="Hiperparametre arama/seçim süreci var mı"
    )
    has_baseline_comparison: bool = Field(
        default=False, description="Başka yöntemlerle karşılaştırma tablosu var mı"
    )
    has_evaluation_metrics: bool = Field(
        default=False, description="Belirli metriklerle (F1, RMSE, accuracy vb.) sonuç raporlanmış mı"
    )

    # Yapısal/sunum ekseni
    has_system_architecture: bool = Field(
        default=False, description="Bir sistem/mimari tasarımı var mı"
    )
    has_survey_structure: bool = Field(
        default=False, description="Literatür tarama/karşılaştırma makalesi mi"
    )
    has_case_study: bool = Field(
        default=False, description="Somut bir uygulama/vaka örneği var mı"
    )
    has_limitations_section: bool = Field(
        default=False, description="Yazar kendi sınırlamalarını açıkça belirtmiş mi"
    )
    has_future_work: bool = Field(
        default=False, description="Gelecek çalışma önerileri var mı"
    )
    has_decision_workflow: bool = Field(
        default=False,
        description="Makalede bir karar ağacı/seçim yol haritası var mı (yes/no dallanan adımlar)",
    )
    has_extractable_figures: bool = Field(
        default=False,
        description="Makaleden ayıklanmış şema/figür/grafik görseli var mı",
    )

    # Metadata
    primary_domain: str = Field(
        default="General Science",
        description="örn: 'optimization theory', 'NLP', 'time-series', 'computer vision'",
    )
    confidence: float = Field(
        default=0.9, ge=0.0, le=1.0, description="Modelin kendi kararına genel güveni (0.0 - 1.0 arası)"
    )

    @property
    def domain(self) -> str:
        return self.primary_domain



class ClassifyRequest(BaseModel):
    """POST /classify endpoint'i için istek şeması."""

    parsed_document: ParsedDocument = Field(..., description="Ayrıştırılmış doküman nesnesi")


class ParseAndClassifyResponse(BaseModel):
    """POST /parse-and-classify endpoint'i için birleşik yanıt şeması."""

    parsed_document: ParsedDocument = Field(..., description="Ayrıştırılmış doküman çıktısı")
    paper_profile: PaperProfile = Field(..., description="Tespit edilen makale profili ve bayrakları")
