# rnd-paper-canvas

Akademik makale ve araştırma raporlarını (matematik, ML/AI, Data Science eksenli) otomatik olarak analiz edip yapılandırılmış rapora çeviren, görsel bir canvas üzerinde organize etmenizi sağlayan ArGe asistanı ve analiz motoru.

Bu repo **Faz 1 Analiz Motorunun** Step 1, 2, 3, 4 ve 5 aşamalarını eksiksiz olarak içerir:

1. **Docling Parser (Step 1):** PDF dökümanlarını layout-aware olarak ayrıştırarak bölümler (sections), başlık seviyeleri (hierarchy level), sayfa aralıkları (page_start, page_end) ve matematiksel formülleri (formulas) yapılandırılmış JSON çıktısına dönüştürür.
2. **PaperProfile Classifier (Step 2):** Düşük token maliyetiyle doküman iskeletini tek seferlik Groq API çağrısıyla (`llama-3.3-70b-versatile`) analiz ederek 17 bağımsız içerik bayrağı (Matematik, ML/AI/DS, Yapısal), birincil araştırma alanı (`primary_domain`) ve güven skoru (`confidence`) çıkarır.
3. **Section Routing & ChromaDB (Step 3):** `PaperProfile` bayraklarına göre makale için üretilecek aktif rapor bölüm gruplarını (`ActiveSectionGroup`) belirler ve bölüm sınırlarını koruyarak dokümanı yerel persistent ChromaDB'ye (`chroma_data/`) indeksler.
4. **Slot Doldurma & Rapor Üretimi (Step 4):** Her aktif bölüm grubu için ChromaDB'den semantik parçaları çeker (retrieval) ve Groq structured output ile tipine uygun (`prose`, `table`, `list`) zengin rapor içeriğini kaynak sayfa referanslarıyla (`SourceReference`) üretir.
5. **Kontrol Paneli (Step 5):** Kullanıcının hangi bölümleri rapora dahil edeceğini, bölüm sırasını (`order`) ve hangi bölümler için diyagram üretileceğini (`diagram_requested`) belirleyip nihai raporu finalize etmesini sağlayan ara yönetim katmanıdır.

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
| `POST` | `/full-pipeline` | **Uçtan Uca:** PDF -> Parse -> Classify -> Index -> Route -> Slot Fill |
| `POST` | `/control-panel/build` | Doldurulmuş bölümlerden kullanıcı kontrol paneli durumunu oluşturur |
| `PATCH` | `/control-panel/update` | Kullanıcı bölüm seçimlerini ve sıralamayı günceller |
| `POST` | `/control-panel/finalize` | Seçimlere göre filtrelenmiş ve sıralanmış nihai raporu döner |

---

## 🧪 Testleri Çalıştırma

```bash
pytest tests/
```
