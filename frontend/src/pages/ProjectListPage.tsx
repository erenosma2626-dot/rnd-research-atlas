import React, { useEffect, useState } from 'react';
import {
  Compass,
  LayoutGrid,
  Plus,
  ArrowRight,
  Boxes,
} from 'lucide-react';
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

  // Create Project Modal State
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
      setError(err.message || 'Projeler yüklenirken hata oluştu.');
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
      const newProj = await createProject(newProjectName.trim(), newProjectDesc.trim() || undefined);
      setProjects((prev) => [
        {
          id: newProj.id,
          name: newProj.name,
          owner_id: user?.id || '',
          role: 'owner' as const,
          created_at: new Date().toISOString(),
        },
        ...prev,
      ]);
      setIsCreateModalOpen(false);
      setNewProjectName('');
      setNewProjectDesc('');
      onSelectProject(newProj.id, newProj.name, 'owner');
    } catch (err: any) {
      alert(err.message || 'Proje oluşturulamadı.');
    } finally {
      setCreating(false);
    }
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

      {/* Header Bar */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-white/85 dark:bg-[#0A0A0A]/85 border-b border-black/[0.06] dark:border-white/[0.08]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-serif text-base font-semibold tracking-tight text-[#0A0A0A] dark:text-white">
              PaperCanvas
            </span>
            <span className="text-black/30 dark:text-white/30 text-xs font-mono">·</span>
            <span className="text-xs font-mono text-black/50 dark:text-white/50">
              Araştırma Atölyeleri
            </span>
          </div>

          <div className="flex items-center gap-3">
            {user && (
              <span className="text-[11px] font-mono text-black/50 dark:text-white/50 hidden sm:inline">
                {user.email}
              </span>
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
                className="text-xs font-mono text-black/40 dark:text-white/40 hover:text-rose-500 transition-colors"
                title="Çıkış Yap"
              >
                Çıkış
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-2 text-xs font-mono text-black/40 dark:text-white/40">
              <Compass className="w-3.5 h-3.5" />
              <span>Çalışma Sahaları</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-medium tracking-tight text-[#0A0A0A] dark:text-white leading-[1.08]">
              Araştırma Atölyeleriniz
            </h2>
            <p className="text-sm text-black/55 dark:text-white/55 mt-2">
              Akademik makalelerinizi, kuramsal modellerinizi ve uzamsal tuvalinizi barındıran çalışma alanları.
            </p>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-medium text-white bg-[#0A0A0A] dark:bg-white dark:text-[#0A0A0A] hover:opacity-90 active:scale-[0.99] transition-all shadow-xs self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Atölye Oluştur</span>
          </button>
        </div>

        {loading ? (
          <div className="p-16 text-center text-xs text-black/40 dark:text-white/40 animate-pulse font-mono">
            Atölyeler yükleniyor...
          </div>
        ) : error ? (
          <div className="p-6 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-xs text-rose-600 font-mono">
            {error}
          </div>
        ) : projects.length === 0 ? (
          <div className="p-16 text-center bg-white dark:bg-[#121212] border border-black/[0.06] dark:border-white/[0.08] rounded-3xl shadow-xs">
            <h3 className="font-serif text-xl font-medium mb-1">Henüz bir atölyeniz yok</h3>
            <p className="text-xs text-black/50 dark:text-white/50 mb-6">
              İlk atölyenizi oluşturarak doküman yüklemeye ve uzamsal tuvalde çalışmaya başlayın.
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-6 py-3 rounded-xl text-xs font-medium text-white bg-[#0A0A0A] dark:bg-white dark:text-[#0A0A0A] hover:opacity-90 transition-all shadow-sm"
            >
              + Atölye Oluştur
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((p) => (
              <div
                key={p.id}
                onClick={() => onSelectProject(p.id, p.name, p.role)}
                className="group relative flex flex-col justify-between p-6 rounded-3xl bg-white dark:bg-[#141414] border border-black/[0.06] dark:border-white/[0.08] hover:border-black/25 dark:hover:border-white/25 shadow-xs hover:shadow-[0_16px_40px_rgba(0,0,0,0.07)] dark:hover:shadow-[0_16px_40px_rgba(0,0,0,0.4)] hover:-translate-y-1 cursor-pointer transition-all duration-200 overflow-hidden"
              >
                <div>
                  {/* Top Header: Atelier Icon & Role Badge */}
                  <div className="flex items-start justify-between gap-3 mb-5">
                    <div className="w-11 h-11 rounded-2xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.05] dark:border-white/[0.08] text-[#0A0A0A] dark:text-white flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-200">
                      <Boxes className="w-5 h-5 text-black dark:text-white" />
                    </div>

                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider bg-black/[0.03] dark:bg-white/[0.05] text-black/70 dark:text-white/70 border border-black/[0.06] dark:border-white/[0.08]">
                      {p.role === 'owner' ? 'Sahip' : p.role === 'editor' ? 'Editör' : 'İzleyici'}
                    </span>
                  </div>

                  {/* Project Title */}
                  <h3 className="font-serif text-xl font-medium text-[#0A0A0A] dark:text-white tracking-tight truncate mb-2">
                    {p.name}
                  </h3>

                  {/* Visual Topology Pill */}
                  <div className="flex items-center gap-1.5 text-xs font-mono text-black/50 dark:text-white/50 mb-4">
                    <LayoutGrid className="w-3.5 h-3.5 text-black dark:text-white" />
                    <span>Sonsuz Tuval & Semantik Arşiv</span>
                  </div>
                </div>

                {/* Bottom Bar: Date & Entry Action */}
                <div className="pt-4 border-t border-black/[0.05] dark:border-white/[0.06] flex items-center justify-between text-xs text-black/50 dark:text-white/50 font-mono">
                  <span className="text-[11px]">
                    {new Date(p.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>

                  <span className="text-[#0A0A0A] dark:text-white font-medium inline-flex items-center gap-1.5 group-hover:translate-x-1 transition-transform text-xs">
                    <span>Atölyeye Gir</span>
                    <ArrowRight className="w-3.5 h-3.5" />
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
              <h3 className="font-serif text-xl font-medium tracking-tight">Yeni Atölye Oluştur</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-xl text-black/40 dark:text-white/40 hover:bg-black/5 dark:hover:bg-white/10"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-black/60 dark:text-white/60 mb-1.5">
                  Atölye Adı
                </label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="Örn: Transformer & Dikkat Mekanizmaları"
                  required
                  className="w-full px-4 py-3 rounded-xl text-sm bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.1] dark:border-white/[0.12] outline-none focus:border-black/50 dark:focus:border-white/50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-black/60 dark:text-white/60 mb-1.5">
                  Araştırma Konusu / Açıklama (Opsiyonel)
                </label>
                <textarea
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  placeholder="Bu atölyede incelenecek modeller ve hedefler..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl text-sm bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.1] dark:border-white/[0.12] outline-none focus:border-black/50 dark:focus:border-white/50 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-medium text-black/60 dark:text-white/60 hover:bg-black/5 dark:hover:bg-white/10"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2.5 rounded-xl text-xs font-medium text-white bg-[#0A0A0A] dark:bg-white dark:text-[#0A0A0A] hover:opacity-90 transition-all disabled:opacity-50 shadow-xs"
                >
                  {creating ? 'Oluşturuluyor...' : 'Atölyeyi Aç'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
