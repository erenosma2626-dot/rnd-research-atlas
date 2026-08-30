import React, { useEffect, useState } from 'react';
import {
  createProjectInvite,
  listProjectMembers,
  ProjectMemberInfo,
  removeProjectMember,
} from '../api/client';
import { useAuth } from '../auth/useAuth';
import { MemberBadge } from '../components/MemberBadge';
import { useTheme } from '../theme/ThemeContext';

interface ProjectSettingsPageProps {
  projectId: string;
  projectName: string;
  userRole: string;
  onNavigateBack: () => void;
}

export const ProjectSettingsPage: React.FC<ProjectSettingsPageProps> = ({
  projectId,
  projectName,
  userRole,
  onNavigateBack,
}) => {
  const { user } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const [members, setMembers] = useState<ProjectMemberInfo[]>([]);
  const [loading, setLoading] = useState(true);

  // Invite Form
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'editor' | 'viewer'>('editor');
  const [inviting, setInviting] = useState(false);
  const [generatedInviteLink, setGeneratedInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isOwner = userRole === 'owner';

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const data = await listProjectMembers(projectId);
      setMembers(data);
    } catch {
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [projectId]);

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    try {
      setInviting(true);
      setErrorMsg(null);
      setGeneratedInviteLink(null);

      const res = await createProjectInvite(projectId, inviteEmail.trim(), inviteRole);
      const fullUrl = `${window.location.origin}${res.invite_link}`;
      setGeneratedInviteLink(fullUrl);
      setInviteEmail('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Davet oluşturulamadı.');
    } finally {
      setInviting(false);
    }
  };

  const handleCopyLink = () => {
    if (!generatedInviteLink) return;
    navigator.clipboard.writeText(generatedInviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleRemoveMember = async (targetUserId: string, name: string) => {
    if (!window.confirm(`${name} kullanıcısını projeden çıkarmak istediğinize emin misiniz?`)) return;

    try {
      await removeProjectMember(projectId, targetUserId);
      setMembers((prev) => prev.filter((m) => m.user_id !== targetUserId));
    } catch (err: any) {
      alert(err.message || 'Üye çıkarılamadı.');
    }
  };

  return (
    <div className="min-h-screen bg-bg-light dark:bg-bg-dark text-text-primary-light dark:text-text-primary-dark transition-colors duration-200">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-bg-light/80 dark:bg-bg-dark/80 border-b border-card-border-light dark:border-card-border-dark">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onNavigateBack}
              className="p-2 rounded-xl text-text-secondary-light hover:bg-card-bg-light dark:hover:bg-card-bg-dark transition-colors"
              title="Geri Dön"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-base font-semibold">{projectName}</h1>
              <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                Proje Ayarları & Üyeler
              </p>
            </div>
          </div>

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
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Üye Davet Formu (Sadece Owner) */}
        {isOwner ? (
          <div className="p-6 rounded-3xl bg-card-bg-light dark:bg-card-bg-dark border border-card-border-light dark:border-card-border-dark shadow-xs">
            <h2 className="text-base font-bold mb-1">Projeye Üye Davet Et</h2>
            <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mb-5">
              İş arkadaşınızı projeye dahil etmek için e-posta adresini girin ve davet bağlantısı üretin.
            </p>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-xs text-rose-600">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSendInvite} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="arkadasiniz@lab.io"
                required
                className="flex-1 px-3.5 py-2 rounded-xl text-xs bg-bg-light dark:bg-bg-dark border border-card-border-light dark:border-card-border-dark outline-none focus:border-accent"
              />

              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as any)}
                className="px-3 py-2 rounded-xl text-xs bg-bg-light dark:bg-bg-dark border border-card-border-light dark:border-card-border-dark outline-none focus:border-accent"
              >
                <option value="editor">Editör (Yükleme & Düzenleme)</option>
                <option value="viewer">İzleyici (Sadece Okuma)</option>
              </select>

              <button
                type="submit"
                disabled={inviting}
                className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-accent hover:bg-accent-hover transition-all shadow-xs disabled:opacity-60 flex-shrink-0"
              >
                {inviting ? 'Bağlantı Üretiliyor...' : 'Davet Et'}
              </button>
            </form>

            {generatedInviteLink && (
              <div className="mt-5 p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <span className="text-xs font-semibold text-accent">
                    Davet Bağlantısı Hazır (7 Gün Geçerli)
                  </span>
                  <button
                    onClick={handleCopyLink}
                    className="text-xs font-medium text-accent hover:underline flex items-center gap-1"
                  >
                    {copied ? '✓ Kopyalandı!' : 'Bağlantıyı Kopyala'}
                  </button>
                </div>

                <div className="p-2.5 rounded-xl bg-bg-light dark:bg-bg-dark text-[11px] font-mono text-text-secondary-light break-all select-all">
                  {generatedInviteLink}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-xs text-amber-800 dark:text-amber-300">
            Bu projenin yöneticisi (Owner) değilsiniz. Yeni üye davet etme yetkisi yalnızca proje sahibine aittir.
          </div>
        )}

        {/* Mevcut Üyeler Listesi */}
        <div className="p-6 rounded-3xl bg-card-bg-light dark:bg-card-bg-dark border border-card-border-light dark:border-card-border-dark shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold">Proje Üyeleri</h2>
              <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                Bu çalışma alanına erişimi olan kişiler ({members.length})
              </p>
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-text-secondary-light animate-pulse">
              Üyeler yükleniyor...
            </div>
          ) : (
            <div className="space-y-2.5">
              {members.map((m) => (
                <MemberBadge
                  key={m.id}
                  member={m}
                  isCurrentUser={user?.id === m.user_id}
                  canRemove={isOwner && m.role !== 'owner' && user?.id !== m.user_id}
                  onRemove={() => handleRemoveMember(m.user_id, m.display_name || m.email)}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
