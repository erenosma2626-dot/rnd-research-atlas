import React, { useEffect, useState } from 'react';
import { createProject, listUserProjects, ProjectSummary } from '../api/client';
import { useAuth } from '../auth/useAuth';
import { useTheme } from '../theme/ThemeContext';

interface ProjectListPageProps {
  onSelectProject: (projectId: string, projectName: string, userRole: string) => void;
}

export const ProjectListPage: React.FC<ProjectListPageProps> = ({ onSelectProject }) => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New Project Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const data = await listUserProjects();
      setProjects(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Projeler yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    try {
      setCreating(true);
      const created = await createProject(newProjectName.trim(), newProjectDesc.trim() || undefined);
      setProjects((prev) => [created, ...prev]);
      setIsCreateModalOpen(false);
      setNewProjectName('');
      setNewProjectDesc('');
      onSelectProject(created.id, created.name, created.role);
    } catch (err: any) {
      alert(err.message || 'Proje oluşturulamadı.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-light dark:bg-bg-dark text-text-primary-light dark:text-text-primary-dark transition-colors duration-200">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-bg-light/80 dark:bg-bg-dark/80 border-b border-card-border-light dark:border-card-border-dark">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent text-white flex items-center justify-center font-bold text-base shadow-sm">
              A
            </div>
            <div>
              <h1 className="text-base font-semibold">rnd-paper-canvas</h1>
              <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                Araştırma Çalışma Alanları
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {user && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-card-bg-light dark:bg-card-bg-dark border border-card-border-light dark:border-card-border-dark text-xs">
                <span className="text-text-secondary-light dark:text-text-secondary-dark truncate max-w-[150px]" title={user.email}>
                  {user.email}
                </span>
                <button
                  onClick={logout}
                  className="text-rose-600 hover:text-rose-700 font-medium hover:underline ml-1"
                >
                  Çıkış
                </button>
              </div>
            )}

            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-card-border-light dark:border-card-border-dark text-text-secondary-light hover:bg-card-bg-light dark:hover:bg-card-bg-dark transition-colors"
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
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark">
              Projeleriniz
            </h2>
            <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-1">
              Birlikte çalıştığınız ve sahibi olduğunuz tüm araştırma projeleri
            </p>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-accent hover:bg-accent-hover transition-all shadow-xs self-start sm:self-auto"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Yeni Proje Oluştur
          </button>
        </div>

        {loading ? (
          <div className="p-16 text-center text-xs text-text-secondary-light animate-pulse">
            Projeler yükleniyor...
          </div>
        ) : error ? (
          <div className="p-6 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-xs text-rose-600">
            {error}
          </div>
        ) : projects.length === 0 ? (
          <div className="p-16 text-center bg-card-bg-light dark:bg-card-bg-dark border border-card-border-light dark:border-card-border-dark rounded-3xl">
            <h3 className="text-sm font-semibold mb-1">Henüz bir projeniz yok</h3>
            <p className="text-xs text-text-secondary-light mb-4">İlk projenizi oluşturarak doküman yüklemeye ve analiz yapmaya başlayın.</p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-accent hover:bg-accent-hover transition-all shadow-xs"
            >
              + Proje Oluştur
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {projects.map((p) => (
              <div
                key={p.id}
                onClick={() => onSelectProject(p.id, p.name, p.role)}
                className="group relative flex flex-col justify-between p-5 rounded-3xl bg-card-bg-light dark:bg-card-bg-dark border border-card-border-light dark:border-card-border-dark hover:border-accent/60 shadow-xs hover:shadow-card cursor-pointer transition-all duration-200"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950 text-accent flex items-center justify-center font-bold text-sm">
                      {p.name.substring(0, 2).toUpperCase()}
                    </div>

                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                      p.role === 'owner'
                        ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/60'
                        : p.role === 'editor'
                        ? 'bg-blue-50 dark:bg-blue-950/60 text-accent dark:text-blue-300 border-blue-200 dark:border-blue-800/60'
                        : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700'
                    }`}>
                      {p.role === 'owner' ? 'Sahip' : p.role === 'editor' ? 'Editör' : 'İzleyici'}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-text-primary-light dark:text-text-primary-dark group-hover:text-accent transition-colors truncate">
                    {p.name}
                  </h3>
                </div>

                <div className="mt-6 pt-3 border-t border-card-border-light/60 dark:border-card-border-dark/60 flex items-center justify-between text-xs text-text-secondary-light">
                  <span>{new Date(p.created_at).toLocaleDateString('tr-TR')}</span>
                  <span className="text-accent font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    Çalışma Alanına Git &rarr;
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Yeni Proje Modalı */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-card-bg-light dark:bg-card-bg-dark rounded-3xl border border-card-border-light dark:border-card-border-dark p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold">Yeni Proje Oluştur</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-text-secondary-light hover:bg-bg-light dark:hover:bg-bg-dark"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary-light dark:text-text-secondary-dark mb-1.5">
                  Proje Adı
                </label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="Örn: LLM Akıl Yürütme ve Karşılaştırma"
                  required
                  className="w-full px-3.5 py-2 rounded-xl text-xs bg-bg-light dark:bg-bg-dark border border-card-border-light dark:border-card-border-dark outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary-light dark:text-text-secondary-dark mb-1.5">
                  Açıklama (Opsiyonel)
                </label>
                <textarea
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  placeholder="Projenin amacı veya konusu..."
                  rows={3}
                  className="w-full px-3.5 py-2 rounded-xl text-xs bg-bg-light dark:bg-bg-dark border border-card-border-light dark:border-card-border-dark outline-none focus:border-accent resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-medium text-text-secondary-light hover:bg-bg-light dark:hover:bg-bg-dark"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-accent hover:bg-accent-hover transition-all disabled:opacity-60 shadow-xs"
                >
                  {creating ? 'Oluşturuluyor...' : 'Oluştur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
