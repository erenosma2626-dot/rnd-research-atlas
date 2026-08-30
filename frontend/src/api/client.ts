const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8000';

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

export const DEFAULT_PROJECT_ID = '00000000-0000-0000-0000-000000000002';

// 1. Asenkron Doküman Yükleme
export async function uploadDocument(
  file: File,
  projectId: string = DEFAULT_PROJECT_ID
): Promise<UploadDocumentResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE_URL}/documents/upload?project_id=${projectId}`, {
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
  const res = await fetch(`${API_BASE_URL}/documents/${documentId}/status`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Durum sorgulanamadı' }));
    throw new Error(err.detail || `Sunucu hatası: ${res.status}`);
  }
  return res.json();
}

// 3. Kayıtlı Raporu Getirme
export async function getDocumentReport(documentId: string): Promise<HistoricalReportResponse> {
  const res = await fetch(`${API_BASE_URL}/documents/${documentId}/report`);
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
  const res = await fetch(`${API_BASE_URL}/projects/${projectId}/documents`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Dokümanlar listelenemedi' }));
    throw new Error(err.detail || `Sunucu hatası: ${res.status}`);
  }
  return res.json();
}

// 5. Orijinal PDF İndirme URL'i Alma
export async function getOriginalPdfUrl(documentId: string): Promise<string> {
  const res = await fetch(`${API_BASE_URL}/documents/${documentId}/original`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'İndirme URL alınamadı' }));
    throw new Error(err.detail || `Sunucu hatası: ${res.status}`);
  }
  const data = await res.json();
  return data.download_url;
}

// 6. Dokümanı Silme (Soft Delete)
export async function deleteDocument(documentId: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/documents/${documentId}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Doküman silinemedi' }));
    throw new Error(err.detail || `Sunucu hatası: ${res.status}`);
  }
}

// 7. Makale Chatbot Soru Sorma (Object ve Positional destekli)
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

  const res = await fetch(`${API_BASE_URL}/chat`, {
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
  const res = await fetch(`${API_BASE_URL}/generate-diagram`, {
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
  const res = await fetch(`${API_BASE_URL}/control-panel/finalize`, {
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
