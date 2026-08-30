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
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-white dark:bg-[#0A0A0A] text-[#0A0A0A] dark:text-white transition-colors duration-200 font-sans">
      {/* Top right theme toggle */}
      <div className="absolute top-6 right-6">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full border border-black/[0.08] dark:border-white/[0.1] text-black/60 dark:text-white/60 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors"
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

      <div className="w-full max-w-sm bg-white dark:bg-[#141414] border border-black/[0.06] dark:border-white/[0.08] rounded-3xl p-8 shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
        {/* Header / Brand */}
        <div className="text-center mb-6">
          <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-black/[0.04] dark:bg-white/[0.06] text-[#0A0A0A] dark:text-white font-mono flex items-center justify-center font-bold text-sm">
            A
          </div>
          <h2 className="font-serif text-2xl font-medium tracking-tight text-[#0A0A0A] dark:text-white">
            Hesap Oluştur
          </h2>
          <p className="text-xs text-black/50 dark:text-white/50 mt-1">
            ArGe araştırma asistanınıza katılın
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-xs text-rose-600 font-mono">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-xs text-emerald-600 font-mono">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-black/60 dark:text-white/60 mb-1.5">
              E-Posta
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ornek@alanadi.com"
              required
              className="w-full px-4 py-2.5 rounded-full text-xs bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.08] dark:border-white/[0.12] outline-none focus:border-black/30 dark:focus:border-white/30 text-[#0A0A0A] dark:text-white transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-black/60 dark:text-white/60 mb-1.5">
              Şifre (Min. 6 karakter)
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-4 py-2.5 rounded-full text-xs bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.08] dark:border-white/[0.12] outline-none focus:border-black/30 dark:focus:border-white/30 text-[#0A0A0A] dark:text-white transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-black/60 dark:text-white/60 mb-1.5">
              Şifre Tekrar
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-4 py-2.5 rounded-full text-xs bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.08] dark:border-white/[0.12] outline-none focus:border-black/30 dark:focus:border-white/30 text-[#0A0A0A] dark:text-white transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-5 rounded-full text-xs font-medium text-white bg-[#0A0A0A] dark:bg-white dark:text-[#0A0A0A] hover:opacity-90 transition-all shadow-xs disabled:opacity-50"
          >
            {loading ? 'Kayıt Olunuyor...' : 'Kayıt Ol'}
          </button>
        </form>

        {/* Footer Toggle */}
        <div className="mt-6 pt-4 border-t border-black/[0.04] dark:border-white/[0.06] text-center">
          <p className="text-xs text-black/50 dark:text-white/50">
            Zaten hesabınız var mı?{' '}
            <button
              onClick={onNavigateToLogin}
              className="text-[#0A0A0A] dark:text-white font-medium hover:underline"
            >
              Giriş Yapın
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
