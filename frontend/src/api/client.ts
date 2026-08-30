const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8000';

export const DEFAULT_PROJECT_ID = '00000000-0000-0000-0000-000000000002';

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function getAuthHeaders(customHeaders: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = { ...customHeaders };
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  return headers;
}

export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = getAuthHeaders(
    (options.headers as Record<string, string>) || {}
  );
  return fetch(url, { ...options, headers });
}

export interface SourceReference {
  page: number;
  section_title: string;
}

export interface GeneratedDiagram {
  mermaid_code: string;
  group_id?: string;
}

export interface FilledSection {
  group_id: string;
  title: string;
  content_type: 'prose' | 'table' | 'list' | 'error';
  content: Record<string, any>;
  sources: SourceReference[];
  diagram_requested: boolean;
  diagram?: GeneratedDiagram | null;
}

export interface PaperProfile {
  has_theorem_proof: boolean;
  has_heavy_notation: boolean;
  has_algorithm_pseudocode: boolean;
  has_complexity_analysis: boolean;
  has_optimization_formulation: boolean;
  has_ml_experiment: boolean;
  has_ablation_study: boolean;
  has_dataset: boolean;
  has_preprocessing_pipeline: boolean;
  has_hyperparameter_tuning: boolean;
  has_baseline_comparison: boolean;
  has_evaluation_metrics: boolean;
  has_system_architecture: boolean;
  has_survey_structure: boolean;
  has_case_study: boolean;
  has_limitations_section: boolean;
  has_future_work: boolean;
  primary_domain: string;
  confidence: number;
}

export interface ExtractedFormula {
  raw_text: string;
  page: number;
  latex_code?: string | null;
  method: string;
  low_confidence: boolean;
}

export interface FullPipelineResponse {
  document_id: string;
  paper_profile: PaperProfile;
  sections: FilledSection[];
  formulas: ExtractedFormula[];
}

export interface DocumentSummary {
  id: string;
  original_filename: string;
  storage_path: string;
  uploaded_at: string;
  processing_status: 'pending' | 'processing' | 'done' | 'failed';
  error_message?: string | null;
}

export interface DocumentStatusResponse {
  document_id: string;
  original_filename: string;
  processing_status: 'pending' | 'processing' | 'done' | 'failed';
  error_message?: string | null;
  uploaded_at: string;
}

export interface UploadDocumentResponse {
  document_id: string;
  original_filename: string;
  processing_status: string;
  message: string;
}

export interface HistoricalReportResponse {
  document_id: string;
  report_id: string;
  version: number;
  paper_profile: PaperProfile;
  sections: FilledSection[];
  generated_at: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  citations?: Array<{ page: number; section_title: string; chunk_text: string }>;
  sources?: Array<{ page: number; section_title: string; chunk_text: string }>;
}

export interface ChatResponse {
  answer: string;
  citations?: Array<{ page: number; section_title: string; chunk_text: string }>;
  sources?: Array<{ page: number; section_title: string; chunk_text: string }>;
  confidence?: number;
}

export interface SectionCandidate {
  group_id: string;
  title: string;
  content_preview: string;
  included: boolean;
  order: number;
  diagram_eligible: boolean;
  diagram_included: boolean;
}

export interface ControlPanelState {
  document_id?: string;
  candidates: SectionCandidate[];
}

export interface FinalizeReportWithDiagramsResponse {
  document_id: string;
  sections: FilledSection[];
  diagrams: Record<string, GeneratedDiagram>;
}

export interface CanvasUsage {
  canvas_id: string;
  canvas_name: string;
}

export interface InventoryItem {
  id: string;
  original_filename: string;
  storage_path: string;
  uploaded_at: string;
  processing_status: 'pending' | 'processing' | 'done' | 'failed';
  used_in_canvases: CanvasUsage[];
}

export interface ProjectSummary {
  id: string;
  name: string;
  owner_id: string;
  role: 'owner' | 'editor' | 'viewer';
  created_at: string;
}

export interface ProjectMemberInfo {
  id: string;
  user_id: string;
  email: string;
  display_name: string;
  role: 'owner' | 'editor' | 'viewer';
  joined_at?: string | null;
  invited_at: string;
}

export interface InviteResponse {
  invite_token: string;
  invite_link: string;
  role: string;
  invited_email: string;
  expires_at: string;
}

export interface InviteInfo {
  project_id: string;
  project_name: string;
  invited_email: string;
  role: string;
  expires_at: string;
  status: string;
}

export interface CanvasSummary {
  id: string;
  project_id: string;
  name: string;
  created_at: string;
}

export interface CanvasItemData {
  id: string;
  canvas_id: string;
  item_type: 'document_box' | 'note' | 'connection' | string;
  ref_id?: string | null;
  position_x: number;
  position_y: number;
  content?: Record<string, any> | null;
  document_title?: string | null;
  document_status?: string | null;
}

// 1. Asenkron Doküman Yükleme
export async function uploadDocument(
  file: File,
  projectId: string = DEFAULT_PROJECT_ID
): Promise<UploadDocumentResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await authFetch(`${API_BASE_URL}/documents/upload?project_id=${projectId}`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Dosya yükleme başarısız oldu' }));
    throw new Error(err.detail || `Sunucu hatası: ${res.status}`);
  }

  return res.json();
}

// 2. Doküman Durumunu Sorgulama (Polling)
export async function getDocumentStatus(documentId: string): Promise<DocumentStatusResponse> {
  const res = await authFetch(`${API_BASE_URL}/documents/${documentId}/status`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Durum sorgulanamadı' }));
    throw new Error(err.detail || `Sunucu hatası: ${res.status}`);
  }
  return res.json();
}

// 3. Kayıtlı Raporu Getirme
export async function getDocumentReport(documentId: string): Promise<HistoricalReportResponse> {
  const res = await authFetch(`${API_BASE_URL}/documents/${documentId}/report`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Rapor getirilemedi' }));
    throw new Error(err.detail || `Sunucu hatası: ${res.status}`);
  }
  return res.json();
}

// 4. Projedeki Dokümanları Listeleme
export async function listProjectDocuments(
  projectId: string = DEFAULT_PROJECT_ID
): Promise<DocumentSummary[]> {
  const res = await authFetch(`${API_BASE_URL}/projects/${projectId}/documents`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Dokümanlar listelenemedi' }));
    throw new Error(err.detail || `Sunucu hatası: ${res.status}`);
  }
  return res.json();
}

// 5. Orijinal PDF İndirme URL'i Alma
export async function getOriginalPdfUrl(documentId: string): Promise<string> {
  const res = await authFetch(`${API_BASE_URL}/documents/${documentId}/original`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'İndirme URL alınamadı' }));
    throw new Error(err.detail || `Sunucu hatası: ${res.status}`);
  }
  const data = await res.json();
  return data.download_url;
}

// 6. Dokümanı Silme (Soft Delete)
export async function deleteDocument(documentId: string): Promise<void> {
  const res = await authFetch(`${API_BASE_URL}/documents/${documentId}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Doküman silinemedi' }));
    throw new Error(err.detail || `Sunucu hatası: ${res.status}`);
  }
}

// 7. Makale Chatbot Soru Sorma
export async function sendChatMessage(
  paramsOrDocId: { document_id: string; question: string; history?: any[] } | string,
  questionParam?: string,
  historyParam: ChatMessage[] = []
): Promise<ChatResponse> {
  let docId = '';
  let question = '';
  let history: any[] = [];

  if (typeof paramsOrDocId === 'object') {
    docId = paramsOrDocId.document_id;
    question = paramsOrDocId.question;
    history = paramsOrDocId.history || [];
  } else {
    docId = paramsOrDocId;
    question = questionParam || '';
    history = historyParam;
  }

  const res = await authFetch(`${API_BASE_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      document_id: docId,
      question,
      chat_history: history.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Cevap alınamadı' }));
    throw new Error(err.detail || 'Chatbot yanıt veremedi');
  }

  const data = await res.json();
  return {
    answer: data.answer,
    citations: data.citations,
    sources: data.citations,
    confidence: data.confidence,
  };
}

// 8. Tekil Diyagram Üretme
export async function generateDiagram(
  sectionTitle: string,
  sectionContent: Record<string, any>,
  sectionType: string = 'prose'
): Promise<{ mermaid_code: string }> {
  const res = await authFetch(`${API_BASE_URL}/generate-diagram`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      section_title: sectionTitle,
      section_content: sectionContent,
      section_type: sectionType,
    }),
  });

  if (!res.ok) {
    throw new Error('Diyagram üretilemedi');
  }

  return res.json();
}

// 9. Kontrol Panelini Finalize Etme
export async function finalizeReport(
  documentId: string,
  state: ControlPanelState,
  originalSections: FilledSection[]
): Promise<FinalizeReportWithDiagramsResponse> {
  const res = await authFetch(`${API_BASE_URL}/control-panel/finalize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      document_id: documentId,
      control_panel_state: state,
      original_sections: originalSections,
    }),
  });

  if (!res.ok) {
    throw new Error('Rapor güncellenemedi');
  }

  return res.json();
}

// 10. Canvas Oluşturma
export async function createCanvas(
  name: string = 'Ana Canvas',
  projectId: string = DEFAULT_PROJECT_ID
): Promise<CanvasSummary> {
  const res = await authFetch(`${API_BASE_URL}/projects/${projectId}/canvases`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) {
    throw new Error('Canvas oluşturulamadı');
  }
  return res.json();
}

// 11. Projedeki Canvas'ları Listeleme
export async function listProjectCanvases(
  projectId: string = DEFAULT_PROJECT_ID
): Promise<CanvasSummary[]> {
  const res = await authFetch(`${API_BASE_URL}/projects/${projectId}/canvases`);
  if (!res.ok) {
    throw new Error('Canvas listesi alınamadı');
  }
  return res.json();
}

// 11b. Canvas Yeniden Adlandırma
export async function renameCanvas(
  canvasId: string,
  name: string
): Promise<CanvasSummary> {
  const res = await authFetch(`${API_BASE_URL}/canvases/${canvasId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) {
    throw new Error('Canvas adı güncellenemedi');
  }
  return res.json();
}

// 11c. Canvas Silme
export async function deleteCanvas(canvasId: string): Promise<void> {
  const res = await authFetch(`${API_BASE_URL}/canvases/${canvasId}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    throw new Error('Canvas silinemedi');
  }
}

// 11d. Proje Doküman Envanteri (Canvas Kullanım Bilgisi Dahil)
export async function getProjectInventory(
  projectId: string = DEFAULT_PROJECT_ID
): Promise<InventoryItem[]> {
  const res = await authFetch(`${API_BASE_URL}/projects/${projectId}/inventory`);
  if (!res.ok) {
    throw new Error('Proje envanteri alınamadı');
  }
  return res.json();
}

// 12. Canvas Elemanlarını Listeleme
export async function listCanvasItems(canvasId: string): Promise<CanvasItemData[]> {
  const res = await authFetch(`${API_BASE_URL}/canvases/${canvasId}/items`);
  if (!res.ok) {
    throw new Error('Canvas elemanları alınamadı');
  }
  return res.json();
}

// 13. Canvas'a Eleman Ekleme
export async function addCanvasItem(
  canvasId: string,
  itemType: string,
  positionX: number,
  positionY: number,
  refId?: string | null,
  content?: Record<string, any> | null
): Promise<CanvasItemData> {
  const res = await authFetch(`${API_BASE_URL}/canvases/${canvasId}/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      item_type: itemType,
      position_x: positionX,
      position_y: positionY,
      ref_id: refId,
      content,
    }),
  });
  if (!res.ok) {
    throw new Error('Canvas elemanı eklenemedi');
  }
  return res.json();
}

// 14. Canvas Elemanını Güncelleme (Pozisyon ve/veya İçerik)
export async function updateCanvasItem(
  itemId: string,
  patch: {
    position_x?: number;
    position_y?: number;
    content?: Record<string, any>;
  }
): Promise<CanvasItemData> {
  const res = await authFetch(`${API_BASE_URL}/canvas-items/${itemId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
  if (!res.ok) {
    throw new Error('Canvas elemanı güncellenemedi');
  }
  return res.json();
}

export async function updateCanvasItemPosition(
  itemId: string,
  positionX: number,
  positionY: number
): Promise<CanvasItemData> {
  return updateCanvasItem(itemId, { position_x: positionX, position_y: positionY });
}

// 15. Canvas Elemanını Silme
export async function deleteCanvasItem(itemId: string): Promise<void> {
  const res = await authFetch(`${API_BASE_URL}/canvas-items/${itemId}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    throw new Error('Canvas elemanı silinemedi');
  }
}

// 16. Kullanıcının Tüm Projelerini Listeleme
export async function listUserProjects(): Promise<ProjectSummary[]> {
  const res = await authFetch(`${API_BASE_URL}/projects`);
  if (!res.ok) {
    throw new Error('Projeler listelenemedi');
  }
  return res.json();
}

// 17. Yeni Proje Oluşturma
export async function createProject(name: string, description?: string): Promise<ProjectSummary> {
  const res = await authFetch(`${API_BASE_URL}/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, description }),
  });
  if (!res.ok) {
    throw new Error('Proje oluşturulamadı');
  }
  return res.json();
}

// 18. Projeye Üye Davet Etme (Owner)
export async function createProjectInvite(
  projectId: string,
  email: string,
  role: 'editor' | 'viewer' = 'editor'
): Promise<InviteResponse> {
  const res = await authFetch(`${API_BASE_URL}/projects/${projectId}/invite`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, role }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Davet oluşturulamadı' }));
    throw new Error(err.detail || 'Davet oluşturulamadı');
  }
  return res.json();
}

// 19. Davet Bilgisi Çekme
export async function getInviteInfo(inviteToken: string): Promise<InviteInfo> {
  const res = await authFetch(`${API_BASE_URL}/invites/${inviteToken}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Davet bulunamadı' }));
    throw new Error(err.detail || 'Davet bulunamadı');
  }
  return res.json();
}

// 20. Daveti Kabul Etme
export async function acceptProjectInvite(inviteToken: string): Promise<{ status: string; project_id: string; project_name: string }> {
  const res = await authFetch(`${API_BASE_URL}/invites/${inviteToken}/accept`, {
    method: 'POST',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Davet kabul edilemedi' }));
    throw new Error(err.detail || 'Davet kabul edilemedi');
  }
  return res.json();
}

// 21. Proje Üyelerini Listeleme
export async function listProjectMembers(projectId: string): Promise<ProjectMemberInfo[]> {
  const res = await authFetch(`${API_BASE_URL}/projects/${projectId}/members`);
  if (!res.ok) {
    throw new Error('Üyeler listelenemedi');
  }
  return res.json();
}

// 22. Üyeyi Projeden Çıkarma
export async function removeProjectMember(projectId: string, userId: string): Promise<void> {
  const res = await authFetch(`${API_BASE_URL}/projects/${projectId}/members/${userId}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    throw new Error('Üye projeden çıkarılamadı');
  }
}
