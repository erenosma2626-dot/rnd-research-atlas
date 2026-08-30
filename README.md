# rnd-paper-canvas

Akademik makale ve araştırma raporlarını (matematik, ML/AI, Data Science eksenli) otomatik olarak analiz edip yapılandırılmış rapora çeviren, görsel bir canvas üzerinde organize etmenizi sağlayan ArGe asistanı ve analiz motoru.

Bu repo **Step 1 (Docling Parser)**, **Step 2 (PaperProfile Classifier)** ve **Step 3 (Section Routing + ChromaDB Vector Store)** aşamalarını içerir:

1. **Docling Parser:** PDF dökümanlarını layout-aware olarak ayrıştırarak bölümler (sections), başlık seviyeleri (hierarchy level), sayfa aralıkları (page_start, page_end) ve matematiksel formülleri (formulas) yapılandırılmış JSON çıktısına dönüştürür.
2. **PaperProfile Classifier (Groq):** Düşük token maliyetiyle doküman iskeletini (özet + başlık hiyerarşisi + formül metrikleri) tek seferlik Groq API çağrısıyla (`llama-3.3-70b-versatile`) analiz ederek 17 bağımsız içerik bayrağı (Matematik, ML/AI/DS, Yapısal), birincil araştırma alanı (`primary_domain`) ve güven skoru (`confidence`) çıkarır. Token harcamaları `logs/llm_calls.jsonl` dosyasına kaydedilir.
3. **Section Routing:** `PaperProfile` bayraklarına ve genişletilebilir `SECTION_GROUPS` konfigürasyonuna göre makale için üretilecek aktif rapor bölüm gruplarını (`ActiveSectionGroup`) belirler.
4. **ChromaDB Vektör İndeksleme:** Bölüm sınırlarını ve metadata bilgilerini (`document_id`, `section_title`, `section_level`, `page_start`, `page_end`) koruyarak dokümanı yerel kalıcı vektör veritabanına (`chroma_data/`) indeksler; section-bazlı semantik erişim sağlar.

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

### 1. Sağlık Kontrolü
- **`GET /health`** -> `{"status": "ok"}`

### 2. PDF Parse Etme (Step 1)
- **`POST /parse`** -> `ParsedDocument`

### 3. Makale Sınıflandırma (Step 2)
- **`POST /classify`** -> `PaperProfile`

### 4. Vektör İndeksleme (Step 3)
- **`POST /index`** -> `{"status": "indexed", "chunk_count": int}`

### 5. Bölüm Yönlendirme (Step 3)
- **`POST /route-sections`** -> `list[ActiveSectionGroup]`

### 6. Uçtan Uca Birleşik Pipeline (Step 3)
- **`POST /parse-classify-index`**
- Multipart form üzerinden `file` (PDF) yüklenir.
- Yanıt Şeması (`ParseClassifyIndexResponse`):
  ```json
  {
    "document_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "parsed_document": {
      "sections": [...],
      "formulas": [...],
      "raw_markdown": "...",
      "total_pages": 8
    },
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
      "primary_domain": "optimization theory",
      "confidence": 0.94
    },
    "active_sections": [
      {
        "group_id": "core_summary",
        "title": "Özet ve Katkı",
        "matched_flags": []
      },
      {
        "group_id": "method_steps",
        "title": "Yöntem",
        "matched_flags": []
      },
      {
        "group_id": "ml_experiment_table",
        "title": "Veri & Yöntem (ML)",
        "matched_flags": ["has_dataset", "has_ml_experiment", "has_hyperparameter_tuning", "has_evaluation_metrics", "has_baseline_comparison"]
      },
      {
        "group_id": "optimization_formulation",
        "title": "Optimizasyon Formülasyonu",
        "matched_flags": ["has_optimization_formulation"]
      },
      {
        "group_id": "algorithm_section",
        "title": "Algoritma",
        "matched_flags": ["has_algorithm_pseudocode"]
      },
      {
        "group_id": "ablation_study",
        "title": "Ablation Çalışması",
        "matched_flags": ["has_ablation_study"]
      },
      {
        "group_id": "limitations_future",
        "title": "Sınırlamalar ve Gelecek Çalışmalar",
        "matched_flags": ["has_limitations_section", "has_future_work"]
      }
    ]
  }
  ```

---

## 🧪 Testleri Çalıştırma

```bash
pytest tests/
```
