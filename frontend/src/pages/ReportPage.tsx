import React, { useEffect, useState } from 'react';
import {
  FilledSection,
  getDocumentReport,
  getOriginalPdfUrl,
  PaperProfile,
} from '../api/client';
import { ChatWidget } from '../components/ChatWidget';
import { CircularStepProgress } from '../components/CircularStepProgress';
import { ProcessingStatusBadge } from '../components/ProcessingStatusBadge';
import { SectionCard } from '../components/SectionCard';
import { VerticalStepIndicator } from '../components/VerticalStepIndicator';
import { usePollDocumentStatus } from '../hooks/usePollDocumentStatus';
import { useTheme } from '../theme/ThemeContext';
import { ControlPanelDrawer } from './ControlPanelDrawer';

const STAGE_ORDER = [
  'parsing',
  'extracting_formulas',
  'classifying',
  'indexing',
  'generating_report',
];

interface ReportPageProps {
  documentId: string;
  filename?: string;
  onNavigateHome: () => void;
  onNavigateUpload: () => void;
  onNavigatePlan?: (documentId: string) => void;
}

export const ReportPage: React.FC<ReportPageProps> = ({
  documentId,
  filename,
  onNavigateHome,
  onNavigateUpload,
  onNavigatePlan,
}) => {
  const { isDark, toggleTheme } = useTheme();
  const { status, errorMessage, filename: polledFilename } = usePollDocumentStatus(documentId, 2000);

  const [paperProfile, setPaperProfile] = useState<PaperProfile | null>(null);
  const [sections, setSections] = useState<FilledSection[]>([]);
  const [loadingReport, setLoadingReport] = useState<boolean>(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [downloadingPdf, setDownloadingPdf] = useState<boolean>(false);

  const activeFilename = filename || polledFilename || 'Akademik Makale';

  const getStageIndex = (currentStatus: string): number => {
    const idx = STAGE_ORDER.indexOf(currentStatus);
    if (idx !== -1) return idx;
    if (currentStatus === 'pending') return 0;
    if (currentStatus === 'processing') return 1;
    if (currentStatus === 'awaiting_plan_approval') return 4;
    if (currentStatus === 'generating_report') return 4;
    if (currentStatus === 'done') return 5;
    return 0;
  };

  const currentStageIndex = getStageIndex(status);

  // Eğer durum awaiting_plan_approval ise otomatik Planlama sayfasına yönlendir
  useEffect(() => {
    if (status === 'awaiting_plan_approval' && onNavigatePlan) {
      onNavigatePlan(documentId);
    }
  }, [status, documentId, onNavigatePlan]);

  useEffect(() => {
    if (status === 'done' && !paperProfile && !loadingReport) {
      setLoadingReport(true);
      getDocumentReport(documentId)
        .then((data) => {
          setPaperProfile(data.paper_profile);
          setSections(data.sections);
          setReportError(null);
        })
        .catch((err: any) => {
          setReportError(err.message || 'Rapor verisi getirilemedi.');
        })
        .finally(() => {
          setLoadingReport(false);
        });
    }
  }, [status, documentId, paperProfile, loadingReport]);

  const handleDownloadOriginal = async () => {
    try {
      setDownloadingPdf(true);
      const url = await getOriginalPdfUrl(documentId);
      window.open(url, '_blank');
    } catch (err: any) {
      alert(err.message || 'İndirme bağlantısı alınamadı.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  // 1. Durum: İşleniyor (Dairesel 5 Dilim + Dikey 5 Nokta İlerleme Ekranı)
  if (status !== 'done' && status !== 'failed') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-between p-6 bg-white dark:bg-[#0A0A0A] text-[#0A0A0A] dark:text-white transition-colors duration-200 font-sans">
        {/* Top subtle bar */}
        <div className="w-full max-w-4xl flex items-center justify-between py-2">
          <button
            onClick={onNavigateHome}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-black/[0.08] dark:border-white/[0.1] text-black/60 dark:text-white/60 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] text-xs font-medium transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Projeye Dön
          </button>

          <button
            onClick={toggleTheme}
            className="p-2 rounded-full border border-black/[0.08] dark:border-white/[0.1] text-black/60 dark:text-white/60 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors"
            title={isDark ? 'Açık Mod' : 'Koyu Mod'}
          >
            {isDark ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
        </div>

        {/* Center Progress Card (2 Sütunlu) */}
        <div className="w-full max-w-2xl my-auto p-8 sm:p-12 rounded-3xl bg-white dark:bg-[#141414] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_12px_40px_rgba(0,0,0,0.06)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.5)]">
          {/* Header Title */}
          <div className="text-center mb-10">
            <h2 className="font-serif text-3xl sm:text-4xl font-medium tracking-tight text-[#0A0A0A] dark:text-white leading-[1.15]">
              Makale Analiz Ediliyor
            </h2>
            <p className="text-xs text-black/50 dark:text-white/50 mt-2 font-mono truncate max-w-md mx-auto" title={activeFilename}>
              {activeFilename}
            </p>
          </div>

          {/* 2-Column Progress Layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-center justify-items-center mb-10">
            {/* Left: Circular Step Progress */}
            <div className="flex items-center justify-center p-2">
              <CircularStepProgress currentStageIndex={currentStageIndex} size={190} />
            </div>

            {/* Right: Vertical Step Indicator */}
            <div className="flex flex-col justify-center w-full max-w-[220px]">
              <VerticalStepIndicator currentStageIndex={currentStageIndex} />
            </div>
          </div>

          {/* Action Button */}
          <div className="flex justify-center pt-2 border-t border-black/[0.04] dark:border-white/[0.06]">
            <button
              onClick={onNavigateHome}
              className="px-6 py-2.5 rounded-full text-xs font-medium text-black/70 dark:text-white/70 border border-black/[0.08] dark:border-white/[0.12] hover:bg-black/[0.04] dark:hover:bg-white/[0.06] hover:text-[#0A0A0A] dark:hover:text-white transition-all shadow-xs"
            >
              Listeye Dön
            </button>
          </div>
        </div>

        {/* Bottom Background Notice */}
        <p className="text-center text-xs text-black/40 dark:text-white/40 pb-4">
          Bu işlem arka planda çalışmaya devam eder
        </p>
      </div>
    );
  }

  // 2. Durum: Hata
  if (status === 'failed' || reportError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white dark:bg-[#0A0A0A] text-[#0A0A0A] dark:text-white transition-colors duration-200 font-sans">
        <div className="w-full max-w-md p-10 rounded-3xl bg-white dark:bg-[#141414] border border-rose-200 dark:border-rose-900/40 shadow-[0_8px_30px_rgba(0,0,0,0.06)] text-center flex flex-col items-center">
          <div className="w-14 h-14 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-6">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <h2 className="font-serif text-2xl font-medium tracking-tight mb-2">Analiz Başarısız Oldu</h2>
          <p className="text-xs text-rose-600 dark:text-rose-400 mb-6 bg-rose-50 dark:bg-rose-950/30 p-3.5 rounded-2xl border border-rose-100 dark:border-rose-900/40 font-mono">
            {errorMessage || reportError || 'İşlem sırasında bir hata meydana geldi.'}
          </p>

          <div className="flex items-center gap-3">
            <button
              onClick={onNavigateHome}
              className="px-5 py-2 text-xs font-medium rounded-full border border-black/[0.08] dark:border-white/[0.1] text-black/60 dark:text-white/60 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors"
            >
              Listeye Dön
            </button>
            <button
              onClick={onNavigateUpload}
              className="px-5 py-2 text-xs font-medium rounded-full bg-[#0A0A0A] text-white dark:bg-white dark:text-[#0A0A0A] hover:opacity-90 transition-all shadow-xs"
            >
              Tekrar Yükle
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Durum: Hazır (Done)
  return (
    <div className="min-h-screen bg-white dark:bg-[#0A0A0A] text-[#0A0A0A] dark:text-white transition-colors duration-200 font-sans">
      {/* Top Sticky Glassmorphic Navbar */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-white/80 dark:bg-[#0A0A0A]/80 border-b border-black/[0.06] dark:border-white/[0.08]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onNavigateHome}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-black/[0.08] dark:border-white/[0.1] text-black/60 dark:text-white/60 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] text-xs font-medium transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Geri Dön
            </button>
            <div className="h-4 w-px bg-black/[0.06] dark:border-white/[0.08]" />
            <h1 className="text-sm font-semibold truncate max-w-[200px] sm:max-w-md tracking-tight">{activeFilename}</h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Orijinal PDF İndir Button */}
            <button
              onClick={handleDownloadOriginal}
              disabled={downloadingPdf}
              className="hidden sm:flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium rounded-full border border-black/[0.08] dark:border-white/[0.1] text-black/60 dark:text-white/60 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors"
            >
              <svg className="w-3.5 h-3.5 text-black/60 dark:text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              {downloadingPdf ? 'Alınıyor...' : 'Orijinal PDF'}
            </button>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full border border-black/[0.08] dark:border-white/[0.1] text-black/60 dark:text-white/60 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors"
              title={isDark ? 'Açık Mod' : 'Koyu Mod'}
            >
              {isDark ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                  />
                </svg>
              )}
            </button>

            {/* Control Panel Drawer Toggle */}
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#0A0A0A] text-white dark:bg-white dark:text-[#0A0A0A] text-xs font-medium rounded-full hover:opacity-90 active:scale-98 shadow-xs transition-all"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                />
              </svg>
              Bölümleri Yönet
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Document Header & Profile Badges */}
        <div className="mb-12 pb-8 border-b border-black/[0.06] dark:border-white/[0.08]">
          <div className="flex items-center gap-2 mb-3">
            <span className="px-3 py-0.5 rounded-full text-[11px] font-semibold bg-black/[0.04] dark:bg-white/[0.06] text-[#0A0A0A] dark:text-white border border-black/[0.06] dark:border-white/[0.08]">
              {paperProfile?.primary_domain || 'Araştırma Makalesi'}
            </span>
            <ProcessingStatusBadge status="done" />
          </div>

          <h2 className="font-serif text-3xl sm:text-4xl font-medium tracking-tight mt-3 mb-3 text-[#0A0A0A] dark:text-white leading-[1.15]">
            {activeFilename}
          </h2>

          <p className="text-xs text-black/50 dark:text-white/50 font-mono">
            Güven Skoru: %{Math.round((paperProfile?.confidence || 0.9) * 100)} · Toplam {sections.length} Bölüm
          </p>
        </div>

        {/* Section Cards */}
        <div className="space-y-8">
          {sections.map((section, idx) => (
            <SectionCard key={section.group_id || idx} section={section} index={idx} />
          ))}
        </div>
      </main>

      {/* Slide-Over Control Panel Drawer */}
      <ControlPanelDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        documentId={documentId}
        originalSections={sections}
        controlPanelState={{
          candidates: sections.map((s, idx) => {
            const previewText = typeof s.content === 'object' && s.content !== null
              ? (s.content.text || JSON.stringify(s.content))
              : String(s.content || '');
            return {
              section_id: s.group_id,
              group_id: s.group_id,
              title: s.title,
              content_preview: previewText.slice(0, 80),
              included: true,
              order: idx + 1,
              diagram_eligible: true,
              diagram_included: s.diagram_requested || false,
            };
          }),
        }}
        onFinalizeSuccess={(res) => {
          setSections(res.sections);
          setIsDrawerOpen(false);
        }}
      />

      {/* Floating Single-Paper Chatbot */}
      <ChatWidget documentId={documentId} />
    </div>
  );
};
