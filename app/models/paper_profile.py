from pydantic import BaseModel, Field
from app.models.document import ParsedDocument


class PaperProfile(BaseModel):
    """Akademik makale veya araştırma raporunun içerik ve yapısal profil bayrakları."""

    # Matematik ekseni
    has_theorem_proof: bool = Field(
        ..., description="Teorem/lemma/ispat içeriyor mu"
    )
    has_heavy_notation: bool = Field(
        ..., description="Yoğun matematiksel formülasyon var mı"
    )
    has_algorithm_pseudocode: bool = Field(
        ..., description="Algoritma/pseudocode bloğu var mı"
    )
    has_complexity_analysis: bool = Field(
        ..., description="Zaman/uzay karmaşıklığı analizi var mı"
    )
    has_optimization_formulation: bool = Field(
        ..., description="Optimizasyon problemi (objective+constraints) formüle edilmiş mi"
    )

    # ML/AI/DS ekseni
    has_ml_experiment: bool = Field(
        ..., description="Model eğitilip test edilmiş mi"
    )
    has_ablation_study: bool = Field(
        ..., description="Bileşen çıkarma testi var mı"
    )
    has_dataset: bool = Field(
        ..., description="Belirli bir veri seti kullanılmış mı"
    )
    has_preprocessing_pipeline: bool = Field(
        ..., description="Veri temizleme/aggregasyon adımları detaylı anlatılmış mı"
    )
    has_hyperparameter_tuning: bool = Field(
        ..., description="Hiperparametre arama/seçim süreci var mı"
    )
    has_baseline_comparison: bool = Field(
        ..., description="Başka yöntemlerle karşılaştırma tablosu var mı"
    )
    has_evaluation_metrics: bool = Field(
        ..., description="Belirli metriklerle (F1, RMSE, accuracy vb.) sonuç raporlanmış mı"
    )

    # Yapısal/sunum ekseni
    has_system_architecture: bool = Field(
        ..., description="Bir sistem/mimari tasarımı var mı"
    )
    has_survey_structure: bool = Field(
        ..., description="Literatür tarama/karşılaştırma makalesi mi"
    )
    has_case_study: bool = Field(
        ..., description="Somut bir uygulama/vaka örneği var mı"
    )
    has_limitations_section: bool = Field(
        ..., description="Yazar kendi sınırlamalarını açıkça belirtmiş mi"
    )
    has_future_work: bool = Field(
        ..., description="Gelecek çalışma önerileri var mı"
    )

    # Metadata
    primary_domain: str = Field(
        ..., description="örn: 'optimization theory', 'NLP', 'time-series', 'computer vision'"
    )
    confidence: float = Field(
        ..., ge=0.0, le=1.0, description="Modelin kendi kararına genel güveni (0.0 - 1.0 arası)"
    )


class ClassifyRequest(BaseModel):
    """POST /classify endpoint'i için istek şeması."""

    parsed_document: ParsedDocument = Field(..., description="Ayrıştırılmış doküman nesnesi")


class ParseAndClassifyResponse(BaseModel):
    """POST /parse-and-classify endpoint'i için birleşik yanıt şeması."""

    parsed_document: ParsedDocument = Field(..., description="Ayrıştırılmış doküman çıktısı")
    paper_profile: PaperProfile = Field(..., description="Tespit edilen makale profili ve bayrakları")
