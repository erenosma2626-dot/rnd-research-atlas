export interface SourceReference {
  page: number;
  section_title: string;
}

export interface FilledSection {
  group_id: string;
  title: string;
  content_type: 'prose' | 'table' | 'list' | 'error';
  content: {
    text?: string;
    columns?: string[];
    rows?: (string | number)[][];
    items?: string[];
    error?: string;
  };
  sources: SourceReference[];
  diagram_requested?: boolean;
}

export interface PaperProfile {
  has_theorems: boolean;
  has_proofs: boolean;
  has_definitions: boolean;
  has_heavy_notation: boolean;
  has_algorithms: boolean;
  has_complexity_analysis: boolean;
  has_ml_experiments: boolean;
  has_empirical_evaluation: boolean;
  has_benchmarks: boolean;
  has_architecture_diagram: boolean;
  has_data_pipeline: boolean;
  has_training_details: boolean;
  has_theoretical_results: boolean;
  has_system_design: boolean;
  has_user_study: boolean;
  has_case_study: boolean;
  is_survey_review: boolean;
  primary_domain: string;
  confidence: number;
}

export interface ExtractedFormula {
  raw_text: string;
  page: number;
  latex_code: string | null;
  method: string;
  low_confidence: boolean;
}

export interface SectionCandidate {
  group_id: string;
  title: string;
  order: number;
  included: boolean;
  diagram_eligible: boolean;
  diagram_included: boolean;
  content_preview: string;
  sources: SourceReference[];
}

export interface ControlPanelState {
  document_id: string;
  candidates: SectionCandidate[];
}

export interface DiagramNode {
  id: string;
  label: string;
}

export interface DiagramEdge {
  from_id: string;
  to_id: string;
  label?: string | null;
}

export interface DiagramSpec {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  diagram_type?: string;
}

export interface GeneratedDiagram {
  section_id: string;
  mermaid_code: string;
  spec?: DiagramSpec;
}

export interface FullPipelineResponse {
  document_id: string;
  paper_profile: PaperProfile;
  sections: FilledSection[];
  formulas: ExtractedFormula[];
}

export interface FinalizeReportWithDiagramsResponse {
  document_id: string;
  sections: FilledSection[];
  diagrams: GeneratedDiagram[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  document_id: string;
  question: string;
  history?: ChatMessage[];
}

export interface ChatResponse {
  answer: string;
  sources: SourceReference[];
}

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8000';

export async function uploadAndProcess(file: File): Promise<FullPipelineResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/full-pipeline`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Upload and process failed' }));
    throw new Error(errorData.detail || `Sunucu hatası: ${response.status}`);
  }

  return response.json();
}

export async function buildControlPanel(
  documentId: string,
  filledSections: FilledSection[]
): Promise<ControlPanelState> {
  const response = await fetch(`${API_BASE_URL}/control-panel/build`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      document_id: documentId,
      filled_sections: filledSections,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Control panel build failed' }));
    throw new Error(errorData.detail || `Hata: ${response.status}`);
  }

  return response.json();
}

export async function updateControlPanel(state: ControlPanelState): Promise<ControlPanelState> {
  const response = await fetch(`${API_BASE_URL}/control-panel/update`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(state),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Control panel update failed' }));
    throw new Error(errorData.detail || `Hata: ${response.status}`);
  }

  return response.json();
}

export async function finalizeReport(
  documentId: string,
  filledSections: FilledSection[],
  controlPanelState: ControlPanelState
): Promise<FinalizeReportWithDiagramsResponse> {
  const response = await fetch(`${API_BASE_URL}/control-panel/finalize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      document_id: documentId,
      filled_sections: filledSections,
      control_panel_state: controlPanelState,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Finalize failed' }));
    throw new Error(errorData.detail || `Hata: ${response.status}`);
  }

  return response.json();
}

export async function sendChatMessage(request: ChatRequest): Promise<ChatResponse> {
  const response = await fetch(`${API_BASE_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Chat error' }));
    throw new Error(errorData.detail || `Hata: ${response.status}`);
  }

  return response.json();
}

export async function checkHealth(): Promise<{ status: string }> {
  const response = await fetch(`${API_BASE_URL}/health`);
  if (!response.ok) throw new Error('Backend unhealthy');
  return response.json();
}
