# rnd-paper-canvas

Akademik makale ve araştırma raporlarını (matematik, ML/AI, Data Science eksenli) otomatik olarak analiz edip yapılandırılmış rapora çeviren, görsel bir canvas üzerinde organize etmenizi sağlayan ArGe asistanı ve analiz motoru.

Bu repo **Faz 1 Analiz Motoru ve Web Arayüzünün** (Step 1-9) yanı sıra **Faz 2 Kalıcılık ve Veri Katmanını** (Step 10-11) eksiksiz olarak içerir:

1. **Docling Parser (Step 1):** PDF dökümanlarını layout-aware olarak ayrıştırarak bölümler (sections), başlık seviyeleri (hierarchy level), sayfa aralıkları (page_start, page_end) ve matematiksel formülleri (formulas) yapılandırılmış JSON çıktısına dönüştürür.
2. **PaperProfile Classifier (Step 2):** Düşük token maliyetiyle doküman iskeletini tek seferlik Groq API çağrısıyla (`openai/gpt-oss-20b`) analiz ederek 17 bağımsız içerik bayrağı, birincil araştırma alanı (`primary_domain`) ve güven skoru (`confidence`) çıkarır.
3. **Section Routing & ChromaDB (Step 3):** `PaperProfile` bayraklarına göre makale için üretilecek aktif rapor bölüm gruplarını (`ActiveSectionGroup`) belirler ve bölüm sınırlarını koruyarak dokümanı yerel persistent ChromaDB'ye (`chroma_data/`) indeksler.
4. **Slot Doldurma & Rapor Üretimi (Step 4):** Her aktif bölüm grubu için ChromaDB'den semantik parçaları çeker (retrieval) ve Groq structured output ile tipine uygun (`prose`, `table`, `list`) zengin rapor içeriğini kaynak sayfa referanslarıyla (`SourceReference`) üretir.
5. **Kontrol Paneli (Step 5):** Kullanıcının hangi bölümleri rapora dahil edeceğini, bölüm sırasını (`order`) ve hangi bölümler için diyagram üretileceğini (`diagram_requested`) belirleyip nihai raporu finalize etmesini sağlayan yönetim katmanıdır.
6. **Deterministik Diyagram Üretimi (Step 6):** Groq (`openai/gpt-oss-20b`) sadece kısa bir graf JSON spesifikasyonu (`DiagramSpec`: nodes + edges) üretir; Mermaid.js koduna çevrim deterministik olarak kod tarafında yapılır (sıfır LLM syntax hatası).
7. **Makale Chatbotu (Step 7):** İndekslenmiş doküman üzerinde ChromaDB RAG ve Groq (`openai/gpt-oss-20b`) ile halüsinasyon korumalı, kaynak sayfa referanslı serbest soru-cevap asistanıdır.
8. **Formül Extraction & LaTeX Capture (Step 8):** Docling'ten gelen ham formül bloklarını `pix2tex` veya Groq (`openai/gpt-oss-20b`) fallback ile LaTeX'e dönüştürür; `has_heavy_notation` durumunda rapor bölümlerini anahtar formüllerle zenginleştirir.
9. **Frontend Web Arayüzü (Step 9):** React + Vite + Tailwind CSS ile inşa edilmiş; KaTeX formül görüntüleme, Mermaid akış diyagramları, sürükle-bırak kontrol paneli çekmecesi (`@dnd-kit`), açık/koyu tema ve sağ altta yüzen chatbot arayüzü sunan çalışan prototiptir.
10. **PostgreSQL Şeması & MinIO Depolama (Step 10):** SQLAlchemy 2.0 Async, asyncpg ve Alembic ile ORM modelleri (`User`, `Project`, `Document`, `Report`, `Section`, `Note`, `Tag`), Docker Compose ve MinIO S3-uyumlu obje depolama altyapısıdır.
11. **Pipeline DB & Obje Depolama Entegrasyonu (Step 11):** PDF yüklemelerinin MinIO'ya ve analiz sonuçlarının PostgreSQL'e kaydedildiği kalıcı boru hattı; geçmiş dökümanları ve raporları yeniden LLM çalıştırmadan getiren (`GET /projects/{id}/documents`, `GET /documents/{id}/report`, `GET /documents/{id}/original`) REST API katmanıdır.

---

## 🚀 Kurulum

### 1. Docker ile Servisleri Başlatma
```bash
docker compose up -d
```
- **PostgreSQL:** `localhost:5432`
- **MinIO S3:** `localhost:9000` | **MinIO Panel:** `http://localhost:9001` (Kullanıcı: `devadmin`, Şifre: `devpassword123`)

### 2. Backend Kurulumu & Migration
```bash
# Sanal ortam oluşturma ve aktifleştirme
python3 -m venv .venv
source .venv/bin/activate

# Bağımlılıkları yükleme
pip install -r requirements.txt

# Veritabanı tablolarını oluşturma
alembic upgrade head

# Ortam değişkenlerini yapılandırma
cp .env.example .env
```

`.env` dosyanıza kendi Groq API anahtarınızı ekleyin:
```env
GROQ_API_KEY=gsk_...
GROQ_CLASSIFY_MODEL=openai/gpt-oss-20b
GROQ_CHAT_MODEL=openai/gpt-oss-20b
GROQ_DIAGRAM_MODEL=openai/gpt-oss-20b
GROQ_FORMULA_MODEL=openai/gpt-oss-20b
FORMULA_MODE=hybrid
DATABASE_URL=postgresql+asyncpg://postgres:devpassword@localhost:5432/rnd_paper_canvas
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=devadmin
MINIO_SECRET_KEY=devpassword123
MINIO_BUCKET=documents
MINIO_SECURE=false
```

### 3. Frontend Kurulumu
```bash
cd frontend
npm install
```

---

## 💻 Çalıştırma

### Backend Sunucusunu Başlatma
```bash
uvicorn app.main:app --reload --port 8000
```
- **Swagger Dokümantasyonu:** `http://127.0.0.1:8000/docs`

### Frontend Geliştirme Sunucusunu Başlatma
```bash
cd frontend
npm run dev
```
- **Web Arayüzü:** `http://localhost:5173`

---

## 🧪 Testleri Çalıştırma

```bash
# Backend Testleri (66 Test)
.venv/bin/pytest tests/

# Frontend Build Testi
cd frontend && npm run build
```
