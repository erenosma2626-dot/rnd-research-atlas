import React, { useEffect, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  CheckSquare,
  ChevronLeft,
  Eye,
  Image as ImageIcon,
  Layers,
  Sparkles,
  Square,
  Zap,
} from 'lucide-react';
import {
  approveDocumentPlan,
  FigureCandidate,
  getDocumentPlan,
  PlanState,
  updateDocumentPlan,
} from '../api/client';

interface PlanningPageProps {
  documentId: string;
  onNavigateBack: () => void;
  onPlanApproved: (documentId: string) => void;
}

export const PlanningPage: React.FC<PlanningPageProps> = ({
  documentId,
  onNavigateBack,
  onPlanApproved,
}) => {
  const [planState, setPlanState] = useState<PlanState | null>(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewFigure, setPreviewFigure] = useState<FigureCandidate | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadPlan() {
      try {
        setLoading(true);
        const data = await getDocumentPlan(documentId);
        if (isMounted) {
          setPlanState(data);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Plan yüklenemedi.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    loadPlan();
    return () => {
      isMounted = false;
    };
  }, [documentId]);

  // Section toggle include/exclude
  const handleToggleSection = (sectionId: string) => {
    if (!planState) return;
    setPlanState({
      ...planState,
      active_sections: planState.active_sections.map((s) =>
        s.section_id === sectionId ? { ...s, included: !s.included } : s
      ),
    });
  };

  // Section toggle diagram
  const handleToggleDiagram = (sectionId: string) => {
    if (!planState) return;
    setPlanState({
      ...planState,
      active_sections: planState.active_sections.map((s) =>
        s.section_id === sectionId ? { ...s, diagram_included: !s.diagram_included } : s
      ),
    });
  };

  // Section reorder up
  const handleMoveUp = (index: number) => {
    if (!planState || index === 0) return;
    const newSections = [...planState.active_sections];
    const temp = newSections[index - 1];
    newSections[index - 1] = newSections[index];
    newSections[index] = temp;
    newSections.forEach((s, idx) => {
      s.order = idx + 1;
    });
    setPlanState({ ...planState, active_sections: newSections });
  };

  // Section reorder down
  const handleMoveDown = (index: number) => {
    if (!planState || index === planState.active_sections.length - 1) return;
    const newSections = [...planState.active_sections];
    const temp = newSections[index + 1];
    newSections[index + 1] = newSections[index];
    newSections[index] = temp;
    newSections.forEach((s, idx) => {
      s.order = idx + 1;
    });
    setPlanState({ ...planState, active_sections: newSections });
  };

  // Figure toggle include/exclude
  const handleToggleFigure = (figureId: string) => {
    if (!planState) return;
    setPlanState({
      ...planState,
      extracted_figures: planState.extracted_figures.map((f) =>
        f.figure_id === figureId ? { ...f, included: !f.included } : f
      ),
    });
  };

  // Select all / Deselect all sections
  const handleSelectAllSections = (included: boolean) => {
    if (!planState) return;
    setPlanState({
      ...planState,
      active_sections: planState.active_sections.map((s) => ({ ...s, included })),
    });
  };

  // Approve and Generate Report
  const handleApprove = async () => {
    if (!planState) return;
    setApproving(true);
    try {
      await updateDocumentPlan(documentId, planState);
      await approveDocumentPlan(documentId, planState);
      onPlanApproved(documentId);
    } catch (err: any) {
      alert(err.message || 'Rapor üretimi başlatılamadı.');
      setApproving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#0A0A0A] p-6">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 mx-auto border-2 border-[#0A0A0A] dark:border-white border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-mono text-black/50 dark:text-white/50">
            Makale planı ve figür adayları yükleniyor...
          </p>
        </div>
      </div>
    );
  }

  if (error || !planState) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#0A0A0A] p-6">
        <div className="max-w-md w-full p-8 rounded-3xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.08] dark:border-white/[0.1] text-center space-y-4">
          <p className="text-xs text-rose-500 font-mono">{error || 'Plan bulunamadı.'}</p>
          <button
            onClick={onNavigateBack}
            className="px-4 py-2 text-xs rounded-full bg-[#0A0A0A] text-white dark:bg-white dark:text-[#0A0A0A]"
          >
            Geri Dön
          </button>
        </div>
      </div>
    );
  }

  const includedSectionsCount = planState.active_sections.filter((s) => s.included).length;
  const includedFiguresCount = planState.extracted_figures.filter((f) => f.included).length;

  return (
    <div className="min-h-screen bg-white dark:bg-[#0A0A0A] text-[#0A0A0A] dark:text-white transition-colors pb-32">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-[#0A0A0A]/80 backdrop-blur-md border-b border-black/[0.06] dark:border-white/[0.08]">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onNavigateBack}
              className="p-2 rounded-full hover:bg-black/[0.04] dark:hover:bg-white/[0.06] text-black/60 dark:text-white/60 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-sm font-medium font-serif tracking-tight flex items-center gap-2">
                <span>Rapor Planlama & Ön-Üretim Kontrolü</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                  Adım 2 / 2
                </span>
              </h1>
              <p className="text-[11px] text-black/50 dark:text-white/50">
                Üretilecek raporun bölümlerini, şemalarını ve görsel içeriklerini yapılandırın.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleSelectAllSections(true)}
              className="text-[11px] font-medium text-black/60 dark:text-white/60 hover:text-[#0A0A0A] dark:hover:text-white px-2.5 py-1 rounded-lg hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
            >
              Tümünü Seç
            </button>
            <button
              onClick={() => handleSelectAllSections(false)}
              className="text-[11px] font-medium text-black/60 dark:text-white/60 hover:text-[#0A0A0A] dark:hover:text-white px-2.5 py-1 rounded-lg hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
            >
              Tümünü Kaldır
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-6 pt-8 space-y-10">
        {/* Bölüm 1: Rapor Bölüm Adayları ve Sıralama */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-black/60 dark:text-white/60" />
              <h2 className="text-xs font-mono font-semibold uppercase tracking-wider text-black/70 dark:text-white/70">
                Rapor Bölümleri ({includedSectionsCount} / {planState.active_sections.length} Dahil)
              </h2>
            </div>
            <span className="text-[11px] text-black/40 dark:text-white/40">
              Sıralamak için ok butonlarını kullanın
            </span>
          </div>

          <div className="space-y-2">
            {planState.active_sections.map((sec, idx) => (
              <div
                key={sec.section_id}
                className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                  sec.included
                    ? 'bg-black/[0.02] dark:bg-white/[0.03] border-black/[0.08] dark:border-white/[0.1]'
                    : 'opacity-40 bg-transparent border-dashed border-black/[0.06] dark:border-white/[0.08]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={() => handleToggleSection(sec.section_id)}
                    className="p-1 rounded-md text-black/70 dark:text-white/70 hover:scale-105 transition-transform"
                  >
                    {sec.included ? (
                      <CheckSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    ) : (
                      <Square className="w-4 h-4 text-black/30 dark:text-white/30" />
                    )}
                  </button>

                  <span className="text-xs font-mono font-bold text-black/40 dark:text-white/40 w-5">
                    {idx + 1}.
                  </span>

                  <div className="min-w-0">
                    <p className="text-xs font-medium font-sans truncate">{sec.title}</p>
                    <p className="text-[10px] font-mono text-black/40 dark:text-white/40 uppercase">
                      {sec.section_id}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  {/* Diyagram Opsiyonu */}
                  {sec.diagram_available && (
                    <button
                      onClick={() => handleToggleDiagram(sec.section_id)}
                      disabled={!sec.included}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                        sec.diagram_included && sec.included
                          ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800'
                          : 'bg-black/[0.02] dark:bg-white/[0.02] text-black/40 dark:text-white/40 border border-black/[0.06] dark:border-white/[0.08]'
                      }`}
                      title="Bu bölüm için görsel Mermaid akış diyagramı üretilsin mi?"
                    >
                      <Zap className="w-3 h-3" />
                      <span>{sec.diagram_included ? 'Diyagram Dahil' : 'Diyagram Ekle'}</span>
                    </button>
                  )}

                  {/* Sıralama Butonları */}
                  <div className="flex items-center gap-0.5 bg-black/[0.03] dark:bg-white/[0.05] p-0.5 rounded-lg border border-black/[0.06] dark:border-white/[0.08]">
                    <button
                      onClick={() => handleMoveUp(idx)}
                      disabled={idx === 0}
                      className="p-1 rounded hover:bg-black/[0.06] dark:hover:bg-white/[0.08] disabled:opacity-20 text-black/60 dark:text-white/60"
                      title="Yukarı Taşı"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleMoveDown(idx)}
                      disabled={idx === planState.active_sections.length - 1}
                      className="p-1 rounded hover:bg-black/[0.06] dark:hover:bg-white/[0.08] disabled:opacity-20 text-black/60 dark:text-white/60"
                      title="Aşağı Taşı"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Bölüm 2: Çıkarılan Makale Figürleri & Şemaları */}
        {planState.extracted_figures.length > 0 && (
          <section className="space-y-4 pt-4 border-t border-black/[0.06] dark:border-white/[0.08]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-black/60 dark:text-white/60" />
                <h2 className="text-xs font-mono font-semibold uppercase tracking-wider text-black/70 dark:text-white/70">
                  Makale Figür & Şemaları ({includedFiguresCount} / {planState.extracted_figures.length} Seçili)
                </h2>
              </div>
              <span className="text-[11px] text-black/40 dark:text-white/40">
                Raporda yer almasını istediğiniz görselleri işaretleyin
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {planState.extracted_figures.map((fig) => (
                <div
                  key={fig.figure_id}
                  className={`group relative rounded-2xl border overflow-hidden transition-all ${
                    fig.included
                      ? 'bg-black/[0.02] dark:bg-white/[0.03] border-black/[0.1] dark:border-white/[0.15] shadow-xs'
                      : 'opacity-40 bg-transparent border-black/[0.06] dark:border-white/[0.08]'
                  }`}
                >
                  {/* Thumbnail Image */}
                  <div
                    onClick={() => setPreviewFigure(fig)}
                    className="relative w-full h-36 bg-black/[0.03] dark:bg-white/[0.03] overflow-hidden cursor-zoom-in flex items-center justify-center p-2"
                  >
                    <img
                      src={fig.image_url}
                      alt={fig.caption || 'Makale Figürü'}
                      className="max-h-full max-w-full object-contain rounded-lg"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <span className="p-2 rounded-full bg-white text-black shadow-md text-xs">
                        <Eye className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>

                  {/* Caption & Checkbox */}
                  <div className="p-3 flex items-start justify-between gap-2">
                    <p className="text-[11px] font-sans text-black/70 dark:text-white/70 line-clamp-2 leading-snug">
                      {fig.caption || 'Açıklamasız Şema/Görsel'}
                    </p>
                    <button
                      onClick={() => handleToggleFigure(fig.figure_id)}
                      className="p-1 rounded text-indigo-600 dark:text-indigo-400 hover:scale-110 transition-transform flex-shrink-0"
                    >
                      {fig.included ? (
                        <CheckSquare className="w-4 h-4" />
                      ) : (
                        <Square className="w-4 h-4 text-black/30 dark:text-white/30" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Sticky Bottom Action Bar */}
      <div className="fixed bottom-6 left-6 right-6 z-40 max-w-2xl mx-auto">
        <div className="p-3 bg-white/90 dark:bg-[#141414]/90 backdrop-blur-xl rounded-full border border-black/[0.08] dark:border-white/[0.1] shadow-2xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 pl-4 text-xs font-sans text-black/60 dark:text-white/60">
            <span>
              <strong className="text-[#0A0A0A] dark:text-white font-mono font-medium">
                {includedSectionsCount}
              </strong>{' '}
              bölüm
            </span>
            <span>&bull;</span>
            <span>
              <strong className="text-[#0A0A0A] dark:text-white font-mono font-medium">
                {includedFiguresCount}
              </strong>{' '}
              figür
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onNavigateBack}
              className="px-4 py-2 text-xs font-medium text-black/60 dark:text-white/60 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] rounded-full transition-colors"
            >
              Vazgeç
            </button>
            <button
              onClick={handleApprove}
              disabled={approving || includedSectionsCount === 0}
              className="flex items-center gap-2 px-6 py-2.5 text-xs font-medium text-white bg-[#0A0A0A] dark:bg-white dark:text-[#0A0A0A] rounded-full hover:opacity-90 shadow-md transition-all disabled:opacity-30"
            >
              {approving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white dark:border-black border-t-transparent rounded-full animate-spin" />
                  <span>Rapor Başlatılıyor...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Raporu Oluştur & Analizi Başlat</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Lightbox Modal for Previewing Figure */}
      {previewFigure && (
        <div
          onClick={() => setPreviewFigure(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/85 backdrop-blur-md cursor-zoom-out"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-4xl w-full max-h-[90vh] bg-white dark:bg-[#141414] rounded-3xl p-6 shadow-2xl flex flex-col items-center gap-4 overflow-hidden"
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-xs font-mono text-black/50 dark:text-white/50">
                {previewFigure.figure_id}
              </span>
              <button
                onClick={() => setPreviewFigure(null)}
                className="p-2 rounded-full hover:bg-black/[0.06] dark:hover:bg-white/[0.08]"
              >
                &times;
              </button>
            </div>
            <img
              src={previewFigure.image_url}
              alt={previewFigure.caption || 'Önizleme'}
              className="max-h-[65vh] object-contain rounded-2xl"
            />
            {previewFigure.caption && (
              <p className="text-xs text-center text-black/70 dark:text-white/70 font-sans max-w-2xl leading-relaxed">
                {previewFigure.caption}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
