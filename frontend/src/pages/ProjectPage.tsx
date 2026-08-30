import React, { useEffect, useState } from 'react';
import { DEFAULT_PROJECT_ID, deleteDocument, DocumentSummary, listProjectDocuments } from '../api/client';
import { DocumentCard } from '../components/DocumentCard';
import { useTheme } from '../theme/ThemeContext';

interface ProjectPageProps {
  onNavigateUpload: () => void;
  onSelectDocument: (documentId: string) => void;
}

export const ProjectPage: React.FC<ProjectPageProps> = ({ onNavigateUpload, onSelectDocument }) => {
  const { isDark, toggleTheme } = useTheme();
  const [documents, setDocuments] = useState<DocumentSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = async () => {
    try {
      const data = await listProjectDocuments(DEFAULT_PROJECT_ID);
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

    // Devam eden işlem varsa 3 saniyede bir otomatik güncelle
    const interval = setInterval(() => {
      listProjectDocuments(DEFAULT_PROJECT_ID)
        .then((data) => setDocuments(data))
        .catch(() => {});
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleDelete = async (docId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Bu dokümanı silmek istediğinize emin misiniz?')) return;

    try {
      await deleteDocument(docId);
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
    } catch (err: any) {
      alert(err.message || 'Silme işlemi başarısız oldu.');
    }
  };

  return (
    <div className="min-h-screen bg-bg-light dark:bg-bg-dark text-text-primary-light dark:text-text-primary-dark transition-colors duration-200">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-bg-light/80 dark:bg-bg-dark/80 border-b border-card-border-light dark:border-card-border-dark">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent text-white flex items-center justify-center font-bold text-base shadow-sm">
              A
            </div>
            <div>
              <h1 className="text-base font-semibold">rnd-paper-canvas</h1>
              <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                Varsayılan Proje
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
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

            {/* Yeni Doküman Yükle Button */}
            <button
              onClick={onNavigateUpload}
              className="flex items-center gap-2 px-4 py-2 bg-accent text-white text-sm font-medium rounded-xl hover:bg-accent-hover active:scale-98 shadow-sm transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Yeni Doküman Yükle
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Dokümanlar</h2>
            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-1">
              Analiz edilen ve işlenen araştırma makaleleri ({documents.length})
            </p>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-44 rounded-2xl bg-card-bg-light dark:bg-card-bg-dark border border-card-border-light dark:border-card-border-dark p-5"
              />
            ))}
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-sm">
            {error}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && documents.length === 0 && (
          <div className="flex flex-col items-center justify-center p-12 rounded-3xl bg-card-bg-light dark:bg-card-bg-dark border border-dashed border-card-border-light dark:border-card-border-dark text-center my-12">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-accent flex items-center justify-center mb-4">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-1">Henüz doküman bulunmuyor</h3>
            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark max-w-sm mb-6">
              İlk akademik makalenizi veya raporunuzu yükleyerek otomatik analiz sürecini başlatın.
            </p>
            <button
              onClick={onNavigateUpload}
              className="px-5 py-2.5 bg-accent text-white text-sm font-medium rounded-xl hover:bg-accent-hover active:scale-98 shadow-sm transition-all"
            >
              PDF Yükle
            </button>
          </div>
        )}

        {/* Grid List */}
        {!loading && documents.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {documents.map((doc) => (
              <DocumentCard
                key={doc.id}
                document={doc}
                onClick={onSelectDocument}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
