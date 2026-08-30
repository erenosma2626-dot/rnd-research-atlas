import React, { useEffect, useState } from 'react';
import { acceptProjectInvite, getInviteInfo, InviteInfo } from '../api/client';
import { useAuth } from '../auth/useAuth';
import { useTheme } from '../theme/ThemeContext';

interface AcceptInvitePageProps {
  inviteToken: string;
  onAcceptSuccess: (projectId: string, projectName: string) => void;
  onNavigateHome: () => void;
}

export const AcceptInvitePage: React.FC<AcceptInvitePageProps> = ({
  inviteToken,
  onAcceptSuccess,
  onNavigateHome,
}) => {
  const { user } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvite = async () => {
      try {
        setLoading(true);
        const data = await getInviteInfo(inviteToken);
        setInvite(data);
      } catch (err: any) {
        setErrorMsg(err.message || 'Davet bağlantısı geçersiz veya süresi dolmuş.');
      } finally {
        setLoading(false);
      }
    };

    fetchInvite();
  }, [inviteToken]);

  const handleAccept = async () => {
    try {
      setAccepting(true);
      setErrorMsg(null);
      const res = await acceptProjectInvite(inviteToken);
      onAcceptSuccess(res.project_id, res.project_name);
    } catch (err: any) {
      setErrorMsg(err.message || 'Davet kabul edilirken hata oluştu.');
    } finally {
      setAccepting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-bg-light dark:bg-bg-dark transition-colors duration-200">
      <div className="absolute top-6 right-6">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl border border-card-border-light dark:border-card-border-dark bg-card-bg-light dark:bg-card-bg-dark text-text-secondary-light hover:text-text-primary-light transition-colors"
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

      <div className="w-full max-w-md bg-card-bg-light dark:bg-card-bg-dark border border-card-border-light dark:border-card-border-dark rounded-3xl p-8 shadow-card text-center">
        <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-accent flex items-center justify-center">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
        </div>

        <h2 className="text-xl font-bold mb-1">Proje Daveti</h2>

        {loading ? (
          <p className="text-xs text-text-secondary-light my-6 animate-pulse">Davet bilgileri yükleniyor...</p>
        ) : errorMsg ? (
          <div className="my-6">
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-xs text-rose-600 mb-4">
              {errorMsg}
            </div>
            <button
              onClick={onNavigateHome}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-text-primary-light hover:bg-bg-light dark:hover:bg-bg-dark"
            >
              Ana Sayfaya Dön
            </button>
          </div>
        ) : invite ? (
          <div className="my-6 space-y-4 text-left">
            <div className="p-4 rounded-2xl bg-bg-light dark:bg-bg-dark border border-card-border-light dark:border-card-border-dark space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-text-secondary-light">Proje:</span>
                <span className="font-bold">{invite.project_name}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-text-secondary-light">Atanan Rol:</span>
                <span className="font-semibold text-accent capitalize">{invite.role === 'editor' ? 'Editör' : 'İzleyici'}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-text-secondary-light">Davet Edilen E-posta:</span>
                <span className="font-mono text-[11px]">{invite.invited_email}</span>
              </div>
            </div>

            {user?.email?.toLowerCase() !== invite.invited_email.toLowerCase() && (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 text-xs text-amber-800 dark:text-amber-300">
                Dikkat: Bu davet <strong>{invite.invited_email}</strong> için oluşturulmuş. Şu anki oturumunuz: <strong>{user?.email}</strong>.
              </div>
            )}

            <button
              onClick={handleAccept}
              disabled={accepting}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-accent hover:bg-accent-hover transition-all shadow-xs disabled:opacity-60"
            >
              {accepting ? 'Katılınıyor...' : 'Daveti Kabul Et ve Projeye Katıl'}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
};
