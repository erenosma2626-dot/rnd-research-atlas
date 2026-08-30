# rnd-paper-canvas

Akademik makale ve araştırma raporlarını (matematik, ML/AI, Data Science eksenli) otomatik olarak analiz edip yapılandırılmış rapora çeviren, görsel bir canvas üzerinde organize etmenizi sağlayan ArGe asistanı ve analiz motoru.

Bu repo **Faz 1 Analiz Motorunun** Step 1, 2, 3 ve 4 aşamalarını eksiksiz olarak içerir:

1. **Docling Parser (Step 1):** PDF dökümanlarını layout-aware olarak ayrıştırarak bölümler (sections), başlık seviyeleri (hierarchy level), sayfa aralıkları (page_start, page_end) ve matematiksel formülleri (formulas) yapılandırılmış JSON çıktısına dönüştürür.
2. **PaperProfile Classifier (Step 2):** Düşük token maliyetiyle doküman iskeletini tek seferlik Groq API çağrısıyla (`llama-3.3-70b-versatile`) analiz ederek 17 bağımsız içerik bayrağı (Matematik, ML/AI/DS, Yapısal), birincil araştırma alanı (`primary_domain`) ve güven skoru (`confidence`) çıkarır.
3. **Section Routing & ChromaDB (Step 3):** `PaperProfile` bayraklarına göre makale için üretilecek aktif rapor bölüm gruplarını (`ActiveSectionGroup`) belirler ve bölüm sınırlarını koruyarak dokümanı yerel persistent ChromaDB'ye (`chroma_data/`) indeksler.
4. **Slot Doldurma & Rapor Üretimi (Step 4):** Her aktif bölüm grubu için ChromaDB'den semantik parçaları çeker (retrieval) ve Groq structured output ile tipine uygun (`prose`, `table`, `list`) zengin rapor içeriğini kaynak sayfa referanslarıyla (`SourceReference`) üretir.

---

## 🚀 Kurulum

Python 3.10+ ortamı önerilir.

```bash
# Sanal ortam oluşturma ve aktifleştirme
python3 -m venv .venv
source .venv/bin/activate

# Bağımlılıkları yükleme
pip install -r requirements.txt

# Ortam değişkenleri şablonundan .env oluşturma
cp .env.example .env
```

`.env` dosyanıza kendi Groq API anahtarınızı ekleyin:
```env
GROQ_API_KEY=gsk_...
GROQ_CLASSIFY_MODEL=llama-3.3-70b-versatile
```

---

## 💻 Çalıştırma

Geliştirme sunucusunu başlatmak için:

```bash
uvicorn app.main:app --reload --port 8000
```

Sunucu ayağa kalktıktan sonra:
- **API Dokümantasyonu (Swagger):** `http://127.0.0.1:8000/docs`
- **Sağlık Kontrolü:** `http://127.0.0.1:8000/health`

---

## 📡 API Uç Noktaları

| Metot | Uç Nokta | Açıklama |
|---|---|---|
| `GET` | `/health` | Servis sağlık kontrolü |
| `POST` | `/parse` | PDF dosyasını Docling ile yapısal JSON'a dönüştürür |
| `POST` | `/classify` | Ayrıştırılmış dokümandan 17 içerik bayrağı ve `PaperProfile` çıkarır |
| `POST` | `/index` | Dokümanı bölüm ve sayfa metadata'larıyla ChromaDB'ye indeksler |
| `POST` | `/route-sections` | `PaperProfile`'a göre üretilecek aktif bölüm gruplarını döner |
| `POST` | `/generate-report` | ChromaDB'den chunk çekip aktif bölümler için içerik üretir |
| `POST` | `/parse-classify-index` | PDF -> Parse -> Classify -> Index -> Route adımlarını çalıştırır |
| `POST` | `/full-pipeline` | **Uçtan Uca:** PDF -> Parse -> Classify -> Index -> Route -> Slot Fill (Nihai Rapor) |

---

### `/full-pipeline` Örnek Yanıt Şeması

```json
{
  "document_id": "b3e94e4a-93a5-48b4-9273-0599dfa8d052",
  "paper_profile": {
    "has_theorem_proof": false,
    "has_heavy_notation": true,
    "has_algorithm_pseudocode": true,
    "has_complexity_analysis": false,
    "has_optimization_formulation": true,
    "has_ml_experiment": true,
    "has_ablation_study": true,
    "has_dataset": true,
    "has_preprocessing_pipeline": false,
    "has_hyperparameter_tuning": true,
    "has_baseline_comparison": true,
    "has_evaluation_metrics": true,
    "has_system_architecture": false,
    "has_survey_structure": false,
    "has_case_study": false,
    "has_limitations_section": true,
    "has_future_work": true,
    "primary_domain": "NLP optimization",
    "confidence": 0.95
  },
  "sections": [
    {
      "group_id": "core_summary",
      "title": "Özet ve Katkı",
      "content_type": "prose",
      "content": {
        "text": "Bu makale, büyük dil modellerinde çıkarım hızını artıran yeni bir optimizasyon tekniği sunmaktadır..."
      },
      "sources": [
        { "page": 1, "section_title": "Abstract" },
        { "page": 2, "section_title": "Introduction" }
      ]
    },
    {
      "group_id": "ml_experiment_table",
      "title": "Veri & Yöntem (ML)",
      "content_type": "table",
      "content": {
        "columns": ["Dataset", "Ön İşleme", "Model", "Hiperparametreler", "Metrik", "Sonuç"],
        "rows": [
          ["GLUE Benchmark", "BPE Tokenization", "Transformer-Base", "lr=2e-5, bsz=32", "Accuracy", "88.4%"]
        ]
      },
      "sources": [
        { "page": 4, "section_title": "Experiments and Results" }
      ]
    },
    {
      "group_id": "method_steps",
      "title": "Yöntem",
      "content_type": "list",
      "content": {
        "items": [
          "**Adım 1:** Giriş gömme vektörlerinin seyreltilmesi.",
          "**Adım 2:** Dikkat matrisinin blok bazlı hesaplanması."
        ]
      },
      "sources": [
        { "page": 3, "section_title": "Proposed Method" }
      ]
    }
  ]
}
```

---

## 🧪 Testleri Çalıştırma

```bash
pytest tests/
```
