import React, { useEffect, useState } from 'react';
import {
  FilledSection,
  getDocumentReport,
  getOriginalPdfUrl,
  PaperProfile,
} from '../api/client';
import { ChatWidget } from '../components/ChatWidget';
import { ProcessingStatusBadge } from '../components/ProcessingStatusBadge';
import { SectionCard } from '../components/SectionCard';
import { usePollDocumentStatus } from '../hooks/usePollDocumentStatus';
import { useTheme } from '../theme/ThemeContext';
import { ControlPanelDrawer } from './ControlPanelDrawer';

interface ReportPageProps {
  documentId: string;
  filename?: string;
  onNavigateHome: () => void;
  onNavigateUpload: () => void;
}

export const ReportPage: React.FC<ReportPageProps> = ({
  documentId,
  filename,
  onNavigateHome,
  onNavigateUpload,
}) => {
  const { isDark, toggleTheme } = useTheme();
  const { status, errorMessage, filename: polledFilename } = usePollDocumentStatus(documentId, 2500);

  const [paperProfile, setPaperProfile] = useState<PaperProfile | null>(null);
  const [sections, setSections] = useState<FilledSection[]>([]);
  const [loadingReport, setLoadingReport] = useState<boolean>(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [downloadingPdf, setDownloadingPdf] = useState<boolean>(false);

  const activeFilename = filename || polledFilename || 'Akademik Makale';

  // "done" olunca raporu veritabanından çek
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

  // 1. Durum: İşleniyor (Pending / Processing)
  if (status === 'pending' || status === 'processing' || (status === 'done' && loadingReport)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-bg-light dark:bg-bg-dark text-text-primary-light dark:text-text-primary-dark transition-colors duration-200">
        <div className="w-full max-w-md p-8 rounded-3xl bg-card-bg-light dark:bg-card-bg-dark border border-card-border-light dark:border-card-border-dark shadow-card text-center flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-accent flex items-center justify-center mb-6">
            <svg className="w-8 h-8 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          </div>

          <ProcessingStatusBadge status={status} className="mb-3" />
          <h2 className="text-xl font-bold tracking-tight mb-2">Makale Analiz Ediliyor</h2>
          <p className="text-xs sm:text-sm text-text-secondary-light dark:text-text-secondary-dark mb-6">
            {activeFilename} arka planda ayrıştırılıyor, formüller çıkarılıyor ve yapılandırılmış rapor hazırlanıyor...
          </p>

          <div className="w-full bg-blue-100 dark:bg-blue-950/80 h-1.5 rounded-full overflow-hidden mb-6">
            <div className="bg-accent h-full w-full animate-pulse origin-left" />
          </div>

          <button
            onClick={onNavigateHome}
            className="text-xs text-text-secondary-light hover:text-accent transition-colors"
          >
            ← Doküman listesine dön (arka planda devam eder)
          </button>
        </div>
      </div>
    );
  }

  // 2. Durum: Hata (Failed)
  if (status === 'failed' || reportError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-bg-light dark:bg-bg-dark text-text-primary-light dark:text-text-primary-dark transition-colors duration-200">
        <div className="w-full max-w-md p-8 rounded-3xl bg-card-bg-light dark:bg-card-bg-dark border border-rose-200 dark:border-rose-900/60 shadow-card text-center flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mb-6">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.75}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          <ProcessingStatusBadge status="failed" className="mb-3" />
          <h2 className="text-xl font-bold tracking-tight mb-2">Analiz Başarısız Oldu</h2>
          <p className="text-xs sm:text-sm text-rose-600 dark:text-rose-400 mb-6 bg-rose-50 dark:bg-rose-950/30 p-3 rounded-xl border border-rose-100 dark:border-rose-900/40">
            {errorMessage || reportError || 'İşlem sırasında bir hata meydana geldi.'}
          </p>

          <div className="flex items-center gap-3">
            <button
              onClick={onNavigateHome}
              className="px-4 py-2 text-xs font-medium rounded-xl border border-card-border-light dark:border-card-border-dark text-text-secondary-light hover:bg-card-bg-light dark:hover:bg-card-bg-dark transition-colors"
            >
              Proje Listesine Dön
            </button>
            <button
              onClick={onNavigateUpload}
              className="px-4 py-2 text-xs font-medium rounded-xl bg-accent text-white hover:bg-accent-hover transition-all shadow-sm"
            >
              Tekrar Yükle
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Durum: Başarılı ve Hazır (Done)
  return (
    <div className="min-h-screen bg-bg-light dark:bg-bg-dark text-text-primary-light dark:text-text-primary-dark transition-colors duration-200">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-bg-light/80 dark:bg-bg-dark/80 border-b border-card-border-light dark:border-card-border-dark">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onNavigateHome}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-card-border-light dark:border-card-border-dark text-text-secondary-light dark:text-text-secondary-dark hover:bg-card-bg-light dark:hover:bg-card-bg-dark text-xs font-medium transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Tüm Dokümanlar
            </button>
            <div className="h-4 w-px bg-card-border-light dark:bg-card-border-dark" />
            <h1 className="text-sm font-semibold truncate max-w-[200px] sm:max-w-md">{activeFilename}</h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Orijinal PDF İndir Button */}
            <button
              onClick={handleDownloadOriginal}
              disabled={downloadingPdf}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl border border-card-border-light dark:border-card-border-dark text-text-secondary-light dark:text-text-secondary-dark hover:bg-card-bg-light dark:hover:bg-card-bg-dark transition-colors"
            >
              <svg className="w-3.5 h-3.5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              {downloadingPdf ? 'Bağlantı alınıyor...' : 'Orijinal PDF'}
            </button>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-card-border-light dark:border-card-border-dark text-text-secondary-light dark:text-text-secondary-dark hover:bg-card-bg-light dark:hover:bg-card-bg-dark transition-colors"
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
              className="flex items-center gap-1.5 px-3 py-1.5 bg-accent text-white text-xs font-medium rounded-xl hover:bg-accent-hover active:scale-98 shadow-sm transition-all"
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
      <main className="max-w-4xl mx-auto px-6 py-10">
        {/* Document Header & Profile Badges */}
        <div className="mb-10 pb-6 border-b border-card-border-light dark:border-card-border-dark">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-950/60 text-accent border border-blue-100 dark:border-blue-900/60">
              {paperProfile?.primary_domain || 'Araştırma Makalesi'}
            </span>
            <ProcessingStatusBadge status="done" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mt-2 mb-3">
            {activeFilename}
          </h2>

          <p className="text-xs sm:text-sm text-text-secondary-light dark:text-text-secondary-dark">
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
