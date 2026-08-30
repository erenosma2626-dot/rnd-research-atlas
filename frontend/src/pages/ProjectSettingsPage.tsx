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
    <div className="min-h-screen bg-white dark:bg-[#0A0A0A] text-[#0A0A0A] dark:text-white transition-colors duration-200 font-sans">
      {/* Top Sticky Glassmorphic Navbar */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-white/80 dark:bg-[#0A0A0A]/80 border-b border-black/[0.06] dark:border-white/[0.08]">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onNavigateBack}
              className="p-2 rounded-full border border-black/[0.06] dark:border-white/[0.08] text-black/50 dark:text-white/50 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors"
              title="Geri Dön"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-sm font-semibold tracking-tight">{projectName}</h1>
              <p className="text-[11px] text-black/50 dark:text-white/50">
                Proje Ayarları & Üyeler
              </p>
            </div>
          </div>

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
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12 space-y-10">
        {/* Üye Davet Formu (Sadece Owner) */}
        {isOwner ? (
          <div className="p-8 rounded-3xl bg-white dark:bg-[#141414] border border-black/[0.06] dark:border-white/[0.08] shadow-sm">
            <h2 className="font-serif text-2xl font-medium tracking-tight mb-1 text-[#0A0A0A] dark:text-white">
              Projeye Üye Davet Et
            </h2>
            <p className="text-xs text-black/50 dark:text-white/50 mb-6">
              İş arkadaşınızı projeye dahil etmek için e-posta adresini girin ve davet bağlantısı üretin.
            </p>

            {errorMsg && (
              <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-xs text-rose-600 font-mono">
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
                className="flex-1 px-4 py-2.5 rounded-full text-xs bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.08] dark:border-white/[0.12] outline-none focus:border-black/30 dark:focus:border-white/30"
              />

              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as any)}
                className="px-4 py-2.5 rounded-full text-xs bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.08] dark:border-white/[0.12] outline-none focus:border-black/30 dark:focus:border-white/30"
              >
                <option value="editor">Editör (Yükleme & Düzenleme)</option>
                <option value="viewer">İzleyici (Sadece Okuma)</option>
              </select>

              <button
                type="submit"
                disabled={inviting}
                className="px-6 py-2.5 rounded-full text-xs font-medium text-white bg-[#0A0A0A] dark:bg-white dark:text-[#0A0A0A] hover:opacity-90 transition-all shadow-xs disabled:opacity-50 flex-shrink-0"
              >
                {inviting ? 'Üretiliyor...' : 'Davet Et'}
              </button>
            </form>

            {generatedInviteLink && (
              <div className="mt-6 p-5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.08]">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <span className="text-xs font-medium text-[#0A0A0A] dark:text-white">
                    Davet Bağlantısı Hazır (7 Gün Geçerli)
                  </span>
                  <button
                    onClick={handleCopyLink}
                    className="text-xs font-medium text-[#0A0A0A] dark:text-white hover:underline flex items-center gap-1"
                  >
                    {copied ? '✓ Kopyalandı!' : 'Bağlantıyı Kopyala'}
                  </button>
                </div>

                <div className="p-3 rounded-xl bg-white dark:bg-[#0A0A0A] text-[11px] font-mono text-black/60 dark:text-white/60 break-all select-all border border-black/[0.05] dark:border-white/[0.08]">
                  {generatedInviteLink}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.08] text-xs text-black/60 dark:text-white/60">
            Bu projenin yöneticisi (Owner) değilsiniz. Yeni üye davet etme yetkisi yalnızca proje sahibine aittir.
          </div>
        )}

        {/* Mevcut Üyeler Listesi */}
        <div className="p-8 rounded-3xl bg-white dark:bg-[#141414] border border-black/[0.06] dark:border-white/[0.08] shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-serif text-2xl font-medium tracking-tight text-[#0A0A0A] dark:text-white">
                Proje Üyeleri
              </h2>
              <p className="text-xs text-black/50 dark:text-white/50 mt-0.5">
                Bu çalışma alanına erişimi olan kişiler ({members.length})
              </p>
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-black/40 dark:text-white/40 animate-pulse">
              Üyeler yükleniyor...
            </div>
          ) : (
            <div className="space-y-3">
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
