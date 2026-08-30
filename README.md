# rnd-paper-canvas

Akademik makale ve araştırma raporlarını (matematik, ML/AI, Data Science eksenli) otomatik olarak analiz edip yapılandırılmış rapora çeviren, görsel bir canvas üzerinde organize etmenizi sağlayan ArGe asistanı ve analiz motoru.

Bu repo **Step 1: Proje İskeleti + Docling Entegrasyonu** aşamasını içerir. PDF dökümanlarını layout-aware olarak ayrıştırarak bölümler (sections), başlık seviyeleri (hierarchy level), sayfa aralıkları (page_start, page_end) ve matematiksel formülleri (formulas) yapılandırılmış JSON çıktısına dönüştürür.

---

## 🚀 Kurulum

Python 3.10+ ortamı önerilir.

```bash
# Sanal ortam oluşturma ve aktifleştirme
python3 -m venv .venv
source .venv/bin/activate

# Bağımlılıkları yükleme
pip install -r requirements.txt
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
- Yanıt Şeması (`ParsedDocument`):
  ```json
  {
    "sections": [
      {
        "title": "1. Introduction",
        "level": 1,
        "text": "Section textual content...",
        "page_start": 1,
        "page_end": 2
      }
    ],
    "formulas": [
      {
        "raw_text": "f(x) = Wx + b",
        "page": 1
      }
    ],
    "raw_markdown": "# 1. Introduction\n...",
    "total_pages": 10
  }
  ```

---

## 🧪 Testleri Çalıştırma

```bash
pytest tests/
```
