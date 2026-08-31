import React, { useEffect, useState } from 'react';
import { Folder } from 'lucide-react';
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
    <div className="min-h-screen bg-white dark:bg-[#0A0A0A] text-[#0A0A0A] dark:text-white transition-colors duration-200 font-sans">
      {/* Top Sticky Glassmorphic Navbar */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-white/80 dark:bg-[#0A0A0A]/80 border-b border-black/[0.06] dark:border-white/[0.08]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div>
            <h1 className="font-serif text-base font-semibold tracking-tight text-[#0A0A0A] dark:text-white leading-tight">
              PaperCanvas
            </h1>
            <p className="text-[11px] text-black/50 dark:text-white/50">
              Araştırma Çalışma Alanları
            </p>
          </div>

          <div className="flex items-center gap-3">
            {user && (
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/[0.03] dark:bg-white/[0.06] border border-black/[0.05] dark:border-white/[0.08] text-xs">
                <span className="text-black/60 dark:text-white/60 truncate max-w-[160px] font-mono" title={user.email}>
                  {user.email}
                </span>
                <button
                  onClick={logout}
                  className="text-black/40 dark:text-white/40 hover:text-rose-600 dark:hover:text-rose-400 font-medium ml-1 transition-colors"
                >
                  Çıkış
                </button>
              </div>
            )}

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
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
          <div>
            <h2 className="font-serif text-4xl sm:text-5xl font-medium tracking-tight text-[#0A0A0A] dark:text-white leading-[1.08]">
              Projeleriniz
            </h2>
            <p className="text-sm text-black/55 dark:text-white/55 mt-2">
              Birlikte çalıştığınız ve sahibi olduğunuz tüm araştırma projeleri
            </p>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-medium text-white bg-[#0A0A0A] dark:bg-white dark:text-[#0A0A0A] hover:opacity-90 transition-all shadow-sm self-start sm:self-auto"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Yeni Proje Oluştur
          </button>
        </div>

        {loading ? (
          <div className="p-16 text-center text-xs text-black/40 dark:text-white/40 animate-pulse">
            Projeler yükleniyor...
          </div>
        ) : error ? (
          <div className="p-6 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-xs text-rose-600 font-mono">
            {error}
          </div>
        ) : projects.length === 0 ? (
          <div className="p-16 text-center bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.06] dark:border-white/[0.08] rounded-3xl">
            <h3 className="font-serif text-xl font-medium mb-1">Henüz bir projeniz yok</h3>
            <p className="text-xs text-black/50 dark:text-white/50 mb-6">İlk projenizi oluşturarak doküman yüklemeye ve analiz yapmaya başlayın.</p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-6 py-2.5 rounded-full text-xs font-medium text-white bg-[#0A0A0A] dark:bg-white dark:text-[#0A0A0A] hover:opacity-90 transition-all shadow-sm"
            >
              + Proje Oluştur
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((p) => (
              <div
                key={p.id}
                onClick={() => onSelectProject(p.id, p.name, p.role)}
                className="group relative flex flex-col justify-between p-6 rounded-2xl bg-white dark:bg-[#141414] border border-black/[0.06] dark:border-white/[0.08] hover:border-black/20 dark:hover:border-white/20 shadow-sm hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)] hover:-translate-y-0.5 cursor-pointer transition-all duration-200"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] text-[#0A0A0A] dark:text-white flex items-center justify-center flex-shrink-0">
                      <Folder className="w-4 h-4 text-black/70 dark:text-white/70" />
                    </div>

                    <span className="px-3 py-0.5 rounded-full text-[10px] font-semibold border bg-black/[0.03] dark:bg-white/[0.05] text-black/70 dark:text-white/70 border-black/[0.06] dark:border-white/[0.1]">
                      {p.role === 'owner' ? 'Sahip' : p.role === 'editor' ? 'Editör' : 'İzleyici'}
                    </span>
                  </div>

                  <h3 className="font-serif text-lg font-medium text-[#0A0A0A] dark:text-white tracking-tight truncate">
                    {p.name}
                  </h3>
                </div>

                <div className="mt-8 pt-3 border-t border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between text-xs text-black/50 dark:text-white/50">
                  <span className="font-mono text-[11px]">{new Date(p.created_at).toLocaleDateString('tr-TR')}</span>
                  <span className="text-[#0A0A0A] dark:text-white font-medium flex items-center gap-1 group-hover:translate-x-0.5 transition-transform text-xs">
                    Aç &rarr;
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
          <div className="w-full max-w-md bg-white dark:bg-[#141414] rounded-3xl border border-black/[0.08] dark:border-white/[0.12] p-7 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-serif text-xl font-medium tracking-tight">Yeni Proje Oluştur</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-full text-black/40 dark:text-white/40 hover:bg-black/5 dark:hover:bg-white/10"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-black/60 dark:text-white/60 mb-1.5">
                  Proje Adı
                </label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="Örn: LLM Akıl Yürütme ve Karşılaştırma"
                  required
                  className="w-full px-4 py-2.5 rounded-xl text-xs bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.08] dark:border-white/[0.12] outline-none focus:border-black/30 dark:focus:border-white/30"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-black/60 dark:text-white/60 mb-1.5">
                  Açıklama (Opsiyonel)
                </label>
                <textarea
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  placeholder="Projenin amacı veya konusu..."
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl text-xs bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.08] dark:border-white/[0.12] outline-none focus:border-black/30 dark:focus:border-white/30 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-full text-xs font-medium text-black/60 dark:text-white/60 hover:bg-black/5 dark:hover:bg-white/10"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2.5 rounded-full text-xs font-medium text-white bg-[#0A0A0A] dark:bg-white dark:text-[#0A0A0A] hover:opacity-90 transition-all disabled:opacity-50 shadow-xs"
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
