import React, { useState } from 'react';
import { useAuth } from '../auth/useAuth';
import { useTheme } from '../theme/ThemeContext';

interface SignupPageProps {
  onNavigateToLogin: () => void;
}

export const SignupPage: React.FC<SignupPageProps> = ({ onNavigateToLogin }) => {
  const { signup } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMsg('Lütfen tüm alanları doldurun.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Şifreler eşleşmiyor.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Şifre en az 6 karakter olmalıdır.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const { error } = await signup(email.trim(), password);
    if (error) {
      setErrorMsg(error.message || 'Kayıt oluşturulamadı.');
      setLoading(false);
    } else {
      setSuccessMsg('Kayıt başarılı! E-postanızı doğrulayabilir veya doğrudan giriş yapabilirsiniz.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-bg-light dark:bg-bg-dark transition-colors duration-200">
      {/* Top right theme toggle */}
      <div className="absolute top-6 right-6">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl border border-card-border-light dark:border-card-border-dark bg-card-bg-light dark:bg-card-bg-dark text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light transition-colors"
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

      <div className="w-full max-w-sm bg-card-bg-light dark:bg-card-bg-dark border border-card-border-light dark:border-card-border-dark rounded-3xl p-8 shadow-card">
        {/* Header / Brand */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-accent flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark">
            Hesap Oluştur
          </h2>
          <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-1">
            ArGe araştırma asistanınıza katılın
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-600 dark:text-rose-400">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-xs text-emerald-600 dark:text-emerald-400">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-text-secondary-light dark:text-text-secondary-dark mb-1.5">
              E-Posta
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ornek@alanadi.com"
              required
              className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-bg-light dark:bg-bg-dark border border-card-border-light dark:border-card-border-dark outline-none focus:border-accent text-text-primary-light dark:text-text-primary-dark transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary-light dark:text-text-secondary-dark mb-1.5">
              Şifre (Min. 6 karakter)
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-bg-light dark:bg-bg-dark border border-card-border-light dark:border-card-border-dark outline-none focus:border-accent text-text-primary-light dark:text-text-primary-dark transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary-light dark:text-text-secondary-dark mb-1.5">
              Şifre Tekrar
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-bg-light dark:bg-bg-dark border border-card-border-light dark:border-card-border-dark outline-none focus:border-accent text-text-primary-light dark:text-text-primary-dark transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-accent hover:bg-accent-hover transition-all shadow-xs disabled:opacity-60"
          >
            {loading ? 'Kayıt Olunuyor...' : 'Kayıt Ol'}
          </button>
        </form>

        {/* Footer Toggle */}
        <div className="mt-6 pt-4 border-t border-card-border-light/60 dark:border-card-border-dark/60 text-center">
          <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
            Zaten hesabınız var mı?{' '}
            <button
              onClick={onNavigateToLogin}
              className="text-accent font-semibold hover:underline"
            >
              Giriş Yapın
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
