import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  LayoutGrid,
  FileText,
  Plus,
  Tag as TagIcon,
  Users,
} from 'lucide-react';
import {
  DEFAULT_PROJECT_ID,
  deleteDocument,
  DocumentSummary,
  listProjectCanvases,
  listProjectDocuments,
} from '../api/client';
import { useAuth } from '../auth/useAuth';
import { DocumentCard } from '../components/DocumentCard';
import { useTheme } from '../theme/ThemeContext';

interface ProjectPageProps {
  projectId?: string;
  projectName?: string;
  userRole?: string;
  onNavigateUpload: () => void;
  onSelectDocument: (documentId: string) => void;
  onOpenCanvas: (canvasId: string) => void;
  onNavigateSettings?: () => void;
  onNavigateProjectsList?: () => void;
}

export const ProjectPage: React.FC<ProjectPageProps> = ({
  projectId = DEFAULT_PROJECT_ID,
  projectName = 'Varsayılan Proje',
  userRole = 'owner',
  onNavigateUpload,
  onSelectDocument,
  onOpenCanvas,
  onNavigateSettings,
  onNavigateProjectsList,
}) => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [documents, setDocuments] = useState<DocumentSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingCanvas, setLoadingCanvas] = useState<boolean>(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const data = await listProjectDocuments(projectId);
      setDocuments(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Dokümanlar yüklenirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();

    const interval = setInterval(() => {
      listProjectDocuments(projectId)
        .then((data) => setDocuments(data))
        .catch(() => {});
    }, 3000);

    return () => clearInterval(interval);
  }, [projectId]);

  // Unique tags list from all documents
  const allUniqueTags = useMemo(() => {
    const tagSet = new Set<string>();
    documents.forEach((d) => {
      d.tags?.forEach((t) => tagSet.add(t));
    });
    return Array.from(tagSet).sort();
  }, [documents]);

  const toggleTagFilter = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const clearTagFilters = () => {
    setSelectedTags([]);
  };

  // Filtered documents
  const filteredDocuments = useMemo(() => {
    if (selectedTags.length === 0) return documents;
    return documents.filter((d) =>
      d.tags?.some((t) => selectedTags.includes(t))
    );
  }, [documents, selectedTags]);

  const handleOpenCanvasClick = async () => {
    setLoadingCanvas(true);
    try {
      const canvases = await listProjectCanvases(projectId);
      if (canvases.length > 0) {
        onOpenCanvas(canvases[0].id);
      }
    } catch {
      // Hata durumunda sessiz kal
    } finally {
      setLoadingCanvas(false);
    }
  };

  const handleDeleteDoc = async (docId: string) => {
    if (!window.confirm('Bu dokümanı projeden silmek istediğinize emin misiniz?')) {
      return;
    }

    try {
      await deleteDocument(docId);
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
    } catch (err: any) {
      alert(err.message || 'Silme işlemi başarısız oldu.');
    }
  };

  const handleTagsUpdated = (docId: string, updatedTags: string[]) => {
    setDocuments((prev) =>
      prev.map((d) => (d.id === docId ? { ...d, tags: updatedTags } : d))
    );
  };

  return (
    <div className="min-h-screen bg-[#FBFBFA] dark:bg-[#0A0A0A] text-[#0A0A0A] dark:text-white transition-colors duration-200 font-sans selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black">
      {/* Background Subtle Drafting Grid */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.025] dark:opacity-[0.035]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
          backgroundSize: '28px 28px',
        }}
      />

      {/* Top Workspace Header with Central Peer Switcher */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-white/85 dark:bg-[#0A0A0A]/85 border-b border-black/[0.06] dark:border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          
          {/* Left: Breadcrumbs & Project Identity */}
          <div className="flex items-center gap-3 min-w-0">
            {onNavigateProjectsList && (
              <button
                onClick={onNavigateProjectsList}
                className="p-2 rounded-xl text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-all"
                title="Tüm Projeler"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}

            <div className="flex items-center gap-2 min-w-0">
              <span className="font-serif text-sm font-semibold text-black/50 dark:text-white/50 hidden sm:inline">
                PaperCanvas
              </span>
              <span className="text-black/30 dark:text-white/30 hidden sm:inline">/</span>
              <span className="font-serif text-sm font-semibold tracking-tight text-[#0A0A0A] dark:text-white truncate">
                {projectName}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-black/[0.04] dark:bg-white/[0.06] text-black/60 dark:text-white/60">
                {userRole === 'owner' ? 'Sahip' : userRole}
              </span>
            </div>
          </div>

          {/* CENTER: THE PRIMARY WORKSPACE SWITCHER (Canvas vs Catalog) */}
          <div className="flex items-center p-1 rounded-full bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/[0.08]">
            <button
              onClick={handleOpenCanvasClick}
              disabled={loadingCanvas}
              className="flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-mono text-black/65 dark:text-white/65 hover:text-black dark:hover:text-white hover:bg-black/[0.03] dark:hover:bg-white/[0.04] transition-all"
            >
              <LayoutGrid className="w-3.5 h-3.5 text-black dark:text-white" />
              <span>{loadingCanvas ? 'Yükleniyor...' : 'Uzamsal Tuval (Canvas)'}</span>
            </button>

            <button
              className="flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-mono bg-white text-black dark:bg-[#1E1E1E] dark:text-white font-medium shadow-xs"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-500" />
              <span>Makale Masası</span>
            </button>
          </div>

          {/* Right: Actions & User */}
          <div className="flex items-center gap-2.5">
            {userRole !== 'viewer' && (
              <button
                onClick={onNavigateUpload}
                className="hidden md:flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium text-white bg-[#0A0A0A] dark:bg-white dark:text-[#0A0A0A] hover:opacity-90 transition-all shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>PDF Ekle</span>
              </button>
            )}

            {onNavigateSettings && (
              <button
                onClick={onNavigateSettings}
                className="p-2 rounded-xl border border-black/[0.08] dark:border-white/[0.1] text-black/60 dark:text-white/60 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors"
                title="Proje Ayarları & Üyeler"
              >
                <Users className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-black/[0.08] dark:border-white/[0.1] text-black/60 dark:text-white/60 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors"
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

            {user && (
              <button
                onClick={logout}
                className="text-xs font-mono text-black/40 dark:text-white/40 hover:text-rose-500 transition-colors ml-1"
                title="Çıkış Yap"
              >
                Çıkış
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Workspace Stage */}
      <main className="max-w-7xl mx-auto px-6 py-10">
        
        {/* Atelier Status Banner */}
        <div className="mb-10 p-6 rounded-3xl bg-white dark:bg-[#121212] border border-black/[0.06] dark:border-white/[0.08] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5 text-xs font-mono text-black/40 dark:text-white/40">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Aktif Araştırma Atölyesi</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-medium tracking-tight text-[#0A0A0A] dark:text-white">
              Makale Masası & Arşiv
            </h2>
            <p className="text-xs sm:text-sm text-black/55 dark:text-white/55 mt-1 font-sans">
              Bu projeye yüklenen makalelerin semantik analizleri, teorem çıkarımları ve katalog görünümü.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-4">
            <div className="px-4 py-2.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.05] dark:border-white/[0.06] text-center">
              <span className="block font-mono text-lg font-bold text-black dark:text-white">{documents.length}</span>
              <span className="text-[10px] font-mono text-black/50 dark:text-white/50">Makale</span>
            </div>

            <button
              onClick={handleOpenCanvasClick}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] dark:hover:bg-white/[0.1] border border-black/[0.08] dark:border-white/[0.1] text-black dark:text-white text-xs font-mono font-medium transition-all"
            >
              <LayoutGrid className="w-4 h-4" />
              <span>Tuvalde Gör &rarr;</span>
            </button>
          </div>
        </div>

        {/* Tag Filter Bar */}
        {allUniqueTags.length > 0 && (
          <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 scrollbar-none">
            <div className="flex items-center gap-1.5 text-xs text-black/50 dark:text-white/50 font-mono shrink-0 mr-1">
              <TagIcon className="w-3.5 h-3.5" />
              <span>Odak Etiketleri:</span>
            </div>

            {allUniqueTags.map((tag) => {
              const isSelected = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTagFilter(tag)}
                  className={`px-3 py-1 rounded-full text-xs font-mono transition-all select-none shrink-0 ${
                    isSelected
                      ? 'bg-[#0A0A0A] text-white dark:bg-white dark:text-[#0A0A0A] shadow-xs'
                      : 'bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.08] text-black/70 dark:text-white/70 hover:bg-black/[0.06] dark:hover:bg-white/[0.09]'
                  }`}
                >
                  {tag}
                </button>
              );
            })}

            {selectedTags.length > 0 && (
              <button
                type="button"
                onClick={clearTagFilters}
                className="text-xs text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white underline underline-offset-2 font-mono shrink-0 ml-1"
              >
                Tümünü Temizle ({selectedTags.length})
              </button>
            )}
          </div>
        )}

        {/* State Views */}
        {loading ? (
          <div className="p-16 text-center text-xs text-black/40 dark:text-white/40 animate-pulse font-mono">
            Dokümanlar yükleniyor...
          </div>
        ) : error ? (
          <div className="p-6 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-xs text-rose-600 font-mono">
            {error}
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="p-16 text-center bg-white dark:bg-[#121212] border border-black/[0.06] dark:border-white/[0.08] rounded-3xl shadow-xs">
            <h3 className="font-serif text-xl font-medium mb-1 text-[#0A0A0A] dark:text-white">
              {documents.length > 0 ? 'Seçili etiketlerle eşleşen doküman bulunamadı' : 'Bu projede henüz doküman bulunmuyor'}
            </h3>
            <p className="text-xs text-black/50 dark:text-white/50 mb-6">
              {documents.length > 0 ? 'Filtreleri temizleyerek tüm dokümanları görüntüleyebilirsiniz.' : 'Yeni bir akademik makale (PDF) yükleyerek otomatik analizi başlatın.'}
            </p>
            {documents.length > 0 ? (
              <button
                onClick={clearTagFilters}
                className="px-5 py-2 rounded-xl text-xs font-medium border border-black/[0.1] dark:border-white/[0.1] text-black/70 dark:text-white/70 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-all"
              >
                Filtreleri Temizle
              </button>
            ) : userRole !== 'viewer' ? (
              <button
                onClick={onNavigateUpload}
                className="px-6 py-2.5 rounded-xl text-xs font-medium text-white bg-[#0A0A0A] dark:bg-white dark:text-[#0A0A0A] hover:opacity-90 transition-all shadow-sm"
              >
                + Doküman Yükle
              </button>
            ) : null}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDocuments.map((doc) => (
              <DocumentCard
                key={doc.id}
                document={doc}
                onClick={onSelectDocument}
                onOpenCanvas={() => handleOpenCanvasClick()}
                onDelete={userRole !== 'viewer' ? (docId, _e) => handleDeleteDoc(docId) : undefined}
                onTagsUpdated={handleTagsUpdated}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
