import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  SlidersHorizontal,
  ArrowLeft,
  Moon,
  Sun,
  Layers,
  Sparkles,
  FunctionSquare,
  ShieldCheck,
} from 'lucide-react';
import {
  buildControlPanel,
  ControlPanelState,
  ExtractedFormula,
  FilledSection,
  FinalizeReportWithDiagramsResponse,
  FullPipelineResponse,
  GeneratedDiagram,
  PaperProfile,
} from '../api/client';
import { useTheme } from '../theme/ThemeContext';
import { SectionCard } from '../components/SectionCard';
import { FormulaBlock } from '../components/FormulaBlock';
import { ChatWidget } from '../components/ChatWidget';
import { ControlPanelDrawer } from './ControlPanelDrawer';

export const ReportPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const pipelineData: FullPipelineResponse | undefined = location.state?.pipelineData;
  const fileName: string = location.state?.fileName || 'Akademik Makale';

  const [documentId, setDocumentId] = useState<string>('');
  const [paperProfile, setPaperProfile] = useState<PaperProfile | null>(null);
  const [sections, setSections] = useState<FilledSection[]>([]);
  const [originalSections, setOriginalSections] = useState<FilledSection[]>([]);
  const [formulas, setFormulas] = useState<ExtractedFormula[]>([]);
  const [diagrams, setDiagrams] = useState<GeneratedDiagram[]>([]);
  const [controlPanelState, setControlPanelState] = useState<ControlPanelState | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    if (!pipelineData) {
      navigate('/');
      return;
    }

    setDocumentId(pipelineData.document_id);
    setPaperProfile(pipelineData.paper_profile);
    setSections(pipelineData.sections);
    setOriginalSections(pipelineData.sections);
    setFormulas(pipelineData.formulas || []);

    // Build control panel state
    buildControlPanel(pipelineData.document_id, pipelineData.sections)
      .then((state) => setControlPanelState(state))
      .catch((err) => console.error('Control panel build error:', err));
  }, [pipelineData, navigate]);

  const handleFinalizeSuccess = (res: FinalizeReportWithDiagramsResponse) => {
    setSections(res.sections);
    setDiagrams(res.diagrams || []);
  };

  if (!paperProfile) {
    return null;
  }

  // Active flags count
  const activeFlagsCount = Object.entries(paperProfile).filter(
    ([_, v]) => typeof v === 'boolean' && v === true
  ).length;

  return (
    <div className="min-h-screen bg-bg-light dark:bg-bg-dark flex flex-col transition-colors duration-apple pb-24">
      {/* Top Sticky Header */}
      <header className="sticky top-0 z-40 bg-surface-light/80 dark:bg-surface-dark/80 backdrop-blur-md border-b border-border-light dark:border-border-dark transition-colors duration-apple">
        <div className="max-w-5xl mx-auto px-6 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => navigate('/')}
              className="p-2 rounded-xl text-text-secondary-light dark:text-text-secondary-dark hover:bg-bg-light dark:hover:bg-bg-dark transition-colors"
              title="Yeni Makale Yükle"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-text-primary-light dark:text-text-primary-dark truncate">
                {fileName}
              </h1>
              <div className="flex items-center gap-2 text-[11px] text-text-secondary-light dark:text-text-secondary-dark">
                <span className="font-medium text-accent">{paperProfile.primary_domain}</span>
                <span>·</span>
                <span>%{Math.round(paperProfile.confidence * 100)} Güven</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {controlPanelState && (
              <button
                onClick={() => setIsDrawerOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition-all duration-apple"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Kontrol Paneli</span>
              </button>
            )}

            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-bg-light dark:bg-bg-dark border border-border-light dark:border-border-dark text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark transition-colors"
              aria-label="Tema Değiştir"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-accent" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-5xl w-full mx-auto px-6 pt-8 space-y-6">
        {/* Profile & Metadata Banner */}
        <section className="p-6 rounded-2xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-border-light dark:border-border-dark">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-text-primary-light dark:text-text-primary-dark">
                  Makale Analiz Özeti
                </h2>
                <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                  Otomatik sınıflandırma ve yönlendirilmiş rapor şablonu
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs px-3 py-1.5 rounded-full bg-accent/10 text-accent font-semibold flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                {paperProfile.primary_domain}
              </span>
              <span className="text-xs px-3 py-1.5 rounded-full bg-bg-light dark:bg-bg-dark text-text-secondary-light dark:text-text-secondary-dark border border-border-light dark:border-border-dark font-medium">
                {activeFlagsCount} Aktif Bayrak
              </span>
            </div>
          </div>

          {/* Active Flags Pills */}
          <div className="pt-4 flex flex-wrap gap-2">
            {Object.entries(paperProfile)
              .filter(([_, v]) => typeof v === 'boolean' && v === true)
              .map(([flagKey], idx) => (
                <span
                  key={idx}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-bg-light dark:bg-bg-dark text-text-primary-light dark:text-text-primary-dark border border-border-light dark:border-border-dark font-mono"
                >
                  ✓ {flagKey.replace('has_', '').replace('is_', '')}
                </span>
              ))}
          </div>
        </section>

        {/* Section Cards */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-accent" />
              Rapor Bölümleri ({sections.length})
            </h2>
          </div>

          <div className="space-y-6">
            {sections.map((sec, idx) => {
              const matchedDiagram = diagrams.find((d) => d.section_id === sec.group_id);
              return (
                <SectionCard
                  key={sec.group_id || idx}
                  section={sec}
                  diagram={matchedDiagram}
                  index={idx}
                />
              );
            })}
          </div>
        </section>

        {/* Key Formulas Section (if any) */}
        {formulas.length > 0 && (
          <section className="p-6 rounded-2xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-border-light dark:border-border-dark">
              <div className="flex items-center gap-2.5">
                <FunctionSquare className="w-5 h-5 text-accent" />
                <div>
                  <h3 className="text-base font-semibold text-text-primary-light dark:text-text-primary-dark">
                    Çıkarılan LaTeX Formülleri ({formulas.length})
                  </h3>
                  <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                    pix2tex OCR ve Groq ile doğrulanmış matematiksel gösterimler
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {formulas.map((formula, fIdx) => (
                <FormulaBlock key={fIdx} formula={formula} index={fIdx} />
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Control Panel Drawer */}
      {controlPanelState && (
        <ControlPanelDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          documentId={documentId}
          originalSections={originalSections}
          controlPanelState={controlPanelState}
          onFinalizeSuccess={handleFinalizeSuccess}
        />
      )}

      {/* Persistent Chat Widget */}
      {documentId && <ChatWidget documentId={documentId} />}
    </div>
  );
};
