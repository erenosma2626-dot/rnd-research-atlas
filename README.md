# rnd-paper-canvas

Akademik makale ve araştırma raporlarını (matematik, ML/AI, Data Science eksenli) otomatik olarak analiz edip yapılandırılmış rapora çeviren, görsel bir canvas üzerinde organize etmenizi sağlayan ArGe asistanı ve analiz motoru.

Bu repo **Step 1: Docling PDF Parser** ve **Step 2: PaperProfile Classifier** aşamalarını içerir:
1. **Docling Parser:** PDF dökümanlarını layout-aware olarak ayrıştırarak bölümler (sections), başlık seviyeleri (hierarchy level), sayfa aralıkları (page_start, page_end) ve matematiksel formülleri (formulas) yapılandırılmış JSON çıktısına dönüştürür.
2. **PaperProfile Classifier:** Düşük token/maliyet kontrolü ile doküman iskeletini (özet + başlık hiyerarşisi + formül metrikleri) tek seferlik LLM çağrısıyla analiz ederek 17 bağımsız içerik bayrağı (Matematik, ML/AI/DS, Yapısal), birincil araştırma alanı (`primary_domain`) ve güven skoru (`confidence`) çıkarır.

---

## 🚀 Kurulum

Python 3.10+ ortamı önerilir.

```bash
# Sanal ortam oluşturma ve aktifleştirme
python3 -m venv .venv
source .venv/bin/activate

# Bağımlılıkları yükleme
pip install -r requirements.txt

# Ortam değişkenleri (.env) yapılandırması
cp .env.example .env
```

---

## ⚙️ Yapılandırma (`.env`)

```env
# LLM Sağlayıcısı: ollama | openai | anthropic
LLM_PROVIDER=ollama

# Ollama Ayarları
OLLAMA_MODEL=llama3.2
OLLAMA_BASE_URL=http://localhost:11434

# Bulut Sağlayıcıları (LLM_PROVIDER=openai veya anthropic seçildiğinde)
# OPENAI_API_KEY=sk-...
# OPENAI_MODEL=gpt-4o-mini
# ANTHROPIC_API_KEY=sk-ant-...
# ANTHROPIC_MODEL=claude-3-5-haiku-latest
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
- **`GET /health`**
- Yanıt: `{"status": "ok"}`

### 2. PDF Parse Etme
- **`POST /parse`**
- Multipart form üzerinden `file` (PDF) yüklenir.
- Yanıt: `ParsedDocument`

### 3. Makale Sınıflandırma
- **`POST /classify`**
- Girdi: `{"parsed_document": ParsedDocument}`
- Yanıt: `PaperProfile`

### 4. Birleşik Parse + Sınıflandırma
- **`POST /parse-and-classify`**
- Multipart form üzerinden `file` (PDF) yüklenir.
- Yanıt:
  ```json
  {
    "parsed_document": {
      "sections": [...],
      "formulas": [...],
      "raw_markdown": "...",
      "total_pages": 10
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
      "primary_domain": "machine learning optimization",
      "confidence": 0.92
    }
  }
  ```

---

## 🧪 Testleri Çalıştırma

```bash
pytest tests/
```
