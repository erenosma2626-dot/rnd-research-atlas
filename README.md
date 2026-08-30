# rnd-paper-canvas

Akademik makale ve araştırma raporlarını (matematik, ML/AI, Data Science eksenli) otomatik olarak analiz edip yapılandırılmış rapora çeviren, görsel bir canvas üzerinde organize etmenizi sağlayan ArGe asistanı ve analiz motoru.

Bu repo **Faz 1 Analiz Motoru ve Web Arayüzünün** (Step 1-9), **Faz 2 Kalıcılık, Veri ve Asenkron İşlem Katmanının** (Step 10-13), **Faz 3 Görsel Canvas Çalışma Alanının** (Step 14-16) ve **Faz 4 Çoklu Kullanıcı & Yetkilendirme Katmanının** (Step 17-18) özelliklerini içerir:

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
11. **Pipeline DB & Obje Depolama Entegrasyonu (Step 11):** PDF yüklemelerinin MinIO'ya ve analiz sonuçlarının PostgreSQL'e kaydedildiği kalıcı boru hattı; geçmiş dökümanları ve raporları yeniden LLM çalıştırmadan getiren REST API katmanıdır.
12. **Asenkron İşlem Mimarisi (Step 12):** Celery + Redis tabanlı kuyruk yapısı; anında cevap dönen `POST /documents/upload`, `GET /documents/{id}/status` polling endpoint'i ve arka plan hata/yeniden deneme yönetimidir.
13. **Frontend Asenkron Akış & Proje Doküman Listesi (Step 13):** Projedeki tüm dokümanları listeleyen pano görünümü (`ProjectPage`, `DocumentCard`), gerçek zamanlı durum takibi (`usePollDocumentStatus`, `ProcessingStatusBadge`) ve işlenen raporlara kesintisiz geçiştir.
14. **Canvas Temel Kurulumu (Step 14):** React Flow entegrasyonu (`reactflow`), `canvases` ve `canvas_items` PostgreSQL tabloları, sürükle-bırak pozisyon koordinat kaydı (`onNodeDragStop`), doküman kutucuğu düğümleri (`DocumentBoxNode`) ve araç çubuğudur (`CanvasToolbar`).
15. **Canvas Bağlantı ve Not Sistemi (Step 15):** Doküman kutucukları ve notlar arası yönlü ok bağlantıları (`onConnect`, `MarkerType.ArrowClosed`), çift tıklamayla bağlantı etiketi düzenleme, yeniden boyutlandırılabilir serbest not düğümleri (`NoteNode`, `NodeResizer`) ve pozisyon/içerik senkronizasyonudur (`update_item`).
16. **Çoklu Canvas Sekmeleri & Envanter Paneli (Step 16):** Proje içinde bağımsız birden çok canvas sayfası arasında sekme (`CanvasTabs`) ile geçiş, canvas oluşturma/yeniden adlandırma/silme, projedeki tüm dokümanları listeleyen envanter çekmecesi (`InventoryPanel`) ve envanterden canvas'a sürükle-bırak yerleştirmedir (`screenToFlowPosition`).
17. **Supabase Auth Entegrasyonu (Step 17):** Supabase JWT doğrulama (`PyJWT`), FastAPI `get_current_user` dependency injection, otomatik kullanıcı provizyonu (JIT provisioning), React `AuthProvider`, giriş/kayıt sayfaları (`LoginPage`, `SignupPage`) ve kullanıcıya özel proje/doküman izolasyonudur.
18. **Permission Modeli & Proje Davet Sistemi (Step 18):** `ProjectMember` ve `ProjectInvite` tabloları, rol hiyerarşisi (`viewer`, `editor`, `owner`), `require_role` FastAPI dependency katmanı, süreli token tabanlı davet bağlantısı üretme/kabul etme (`POST /projects/{id}/invite`, `POST /invites/{token}/accept`), üye rozetleri (`MemberBadge`), çoklu proje liste paneli (`ProjectListPage`), üye yönetimi (`ProjectSettingsPage`) ve davet karşılama (`AcceptInvitePage`) sayfalarıdır.

---

## 🚀 Kurulum

### 1. Docker ile Servisleri Başlatma (Postgres, MinIO, Redis)
```bash
docker compose up -d
```
- **PostgreSQL:** `localhost:5432`
- **MinIO S3:** `localhost:9000` | **MinIO Panel:** `http://localhost:9001` (Kullanıcı: `devadmin`, Şifre: `devpassword123`)
- **Redis:** `localhost:6379`

### 2. Backend Kurulumu & Migration
```bash
# Sanal ortam oluşturma ve aktifleştirme
python3 -m venv .venv
source .venv/bin/activate

# Bağımlılıkları yükleme
pip install -r requirements.txt

# Veritabanı tablolarını oluşturma / güncelleme
alembic upgrade head

# Ortam değişkenlerini yapılandırma
cp .env.example .env
```

`.env` dosyanıza kendi anahtarlarınızı ekleyin:
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
REDIS_URL=redis://localhost:6379/0
SUPABASE_JWT_SECRET=your_supabase_jwt_secret
```

### 3. Frontend Kurulumu
```bash
cd frontend
npm install
cp .env.example .env
```

`frontend/.env` dosyanıza Supabase proje bilgilerinizi ekleyin:
```env
VITE_API_BASE_URL=http://localhost:8000
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

---

## 💻 Çalıştırma

### 1. Backend API Sunucusunu Başlatma (Terminal 1)
```bash
uvicorn app.main:app --reload --port 8000
```
- **Swagger Dokümantasyonu:** `http://127.0.0.1:8000/docs`

### 2. Celery Arka Plan Worker'ını Başlatma (Terminal 2)
```bash
celery -A app.worker.celery_app worker --loglevel=info
```

### 3. Frontend Geliştirme Sunucusunu Başlatma (Terminal 3)
```bash
cd frontend
npm run dev
```
- **Web Arayüzü:** `http://localhost:5173`

---

## 🧪 Testleri Çalıştırma

```bash
# Backend Testleri
.venv/bin/pytest tests/

# Frontend Build Testi
cd frontend && npm run build
```
