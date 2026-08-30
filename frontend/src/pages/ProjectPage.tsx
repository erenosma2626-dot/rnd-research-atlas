import React, { useEffect, useState } from 'react';
import {
  DEFAULT_PROJECT_ID,
  deleteDocument,
  DocumentSummary,
  listProjectCanvases,
  listProjectDocuments,
} from '../api/client';
import { DocumentCard } from '../components/DocumentCard';
import { useAuth } from '../auth/useAuth';
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

  const fetchDocuments = async () => {
    try {
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

    // Devam eden işlem varsa 3 saniyede bir otomatik güncelle
    const interval = setInterval(() => {
      listProjectDocuments(projectId)
        .then((data) => setDocuments(data))
        .catch(() => {});
    }, 3000);

    return () => clearInterval(interval);
  }, [projectId]);

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

  return (
    <div className="min-h-screen bg-bg-light dark:bg-bg-dark text-text-primary-light dark:text-text-primary-dark transition-colors duration-200">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-bg-light/80 dark:bg-bg-dark/80 border-b border-card-border-light dark:border-card-border-dark">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onNavigateProjectsList && (
              <button
                onClick={onNavigateProjectsList}
                className="p-2 rounded-xl text-text-secondary-light hover:bg-card-bg-light dark:hover:bg-card-bg-dark transition-colors"
                title="Tüm Projelere Dön"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}

            <div className="w-8 h-8 rounded-lg bg-accent text-white flex items-center justify-center font-bold text-base shadow-sm">
              {projectName.substring(0, 1).toUpperCase()}
            </div>
            <div>
              <h1 className="text-base font-semibold">{projectName}</h1>
              <div className="flex items-center gap-1.5 text-xs text-text-secondary-light dark:text-text-secondary-dark">
                <span>Rolünüz: <strong className="capitalize text-text-primary-light dark:text-text-primary-dark">{userRole === 'owner' ? 'Sahip' : userRole === 'editor' ? 'Editör' : 'İzleyici'}</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Proje Ayarları & Üyeler Button */}
            {onNavigateSettings && (
              <button
                onClick={onNavigateSettings}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-card-border-light dark:border-card-border-dark text-xs font-medium text-text-secondary-light hover:text-text-primary-light hover:bg-card-bg-light dark:hover:bg-card-bg-dark transition-all shadow-xs"
                title="Üye Yönetimi ve Proje Ayarları"
              >
                <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                Üyeler & Ayarlar
              </button>
            )}

            {/* Canvas'ı Aç Button */}
            <button
              onClick={handleOpenCanvasClick}
              disabled={loadingCanvas}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-card-border-light dark:border-card-border-dark text-xs font-medium text-text-primary-light dark:text-text-primary-dark hover:bg-card-bg-light dark:hover:bg-card-bg-dark transition-all shadow-xs"
            >
              <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.75}
                  d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
                />
              </svg>
              {loadingCanvas ? 'Canvas Yükleniyor...' : 'Canvas Görünümü'}
            </button>

            {/* User info & Logout */}
            {user && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-card-bg-light dark:bg-card-bg-dark border border-card-border-light dark:border-card-border-dark text-xs">
                <span className="text-text-secondary-light dark:text-text-secondary-dark truncate max-w-[140px]" title={user.email}>
                  {user.email}
                </span>
                <button
                  onClick={logout}
                  className="text-rose-600 hover:text-rose-700 font-medium hover:underline ml-1"
                  title="Çıkış Yap"
                >
                  Çıkış
                </button>
              </div>
            )}

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
          </div>
        </div>
      </header>

      {/* Main Grid Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-xl font-bold">Proje Dokümanları</h2>
            <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-1">
              Bu projede analiz edilmiş veya sıraya alınmış tüm akademik makaleler
            </p>
          </div>

          {userRole !== 'viewer' && (
            <button
              onClick={onNavigateUpload}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-accent hover:bg-accent-hover transition-all shadow-xs self-start sm:self-auto"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Yeni PDF Ekle
            </button>
          )}
        </div>

        {/* State Views */}
        {loading ? (
          <div className="p-16 text-center text-xs text-text-secondary-light animate-pulse">
            Dokümanlar yükleniyor...
          </div>
        ) : error ? (
          <div className="p-6 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-xs text-rose-600">
            {error}
          </div>
        ) : documents.length === 0 ? (
          <div className="p-16 text-center bg-card-bg-light dark:bg-card-bg-dark border border-card-border-light dark:border-card-border-dark rounded-3xl">
            <h3 className="text-sm font-semibold mb-1">Bu projede henüz doküman bulunmuyor</h3>
            <p className="text-xs text-text-secondary-light mb-4">Yeni bir akademik makale (PDF) yükleyerek otomatik analizi başlatın.</p>
            {userRole !== 'viewer' && (
              <button
                onClick={onNavigateUpload}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-accent hover:bg-accent-hover transition-all shadow-xs"
              >
                + Doküman Yükle
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {documents.map((doc) => (
              <DocumentCard
                key={doc.id}
                document={doc}
                onClick={onSelectDocument}
                onDelete={userRole !== 'viewer' ? (docId, _e) => handleDeleteDoc(docId) : undefined}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
