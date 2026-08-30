import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../auth/useAuth';
import { FloatingShapesScene } from '../components/3d/FloatingShapesScene';
import { useTheme } from '../theme/ThemeContext';

interface LoginPageProps {
  onNavigateHome?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigateHome }) => {
  const { login, signup } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  // Mode: 'login' or 'signup'
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMsg('Lütfen e-posta ve şifrenizi girin.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const { error } = await login(email.trim(), password);
    if (error) {
      setErrorMsg(error.message || 'Giriş yapılamadı. Bilgilerinizi kontrol edin.');
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
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
      setSuccessMsg('Kayıt başarılı! Giriş yapabilirsiniz.');
      setLoading(false);
      setTimeout(() => {
        setMode('login');
        setSuccessMsg(null);
      }, 1800);
    }
  };

  const toggleMode = (newMode: 'login' | 'signup') => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setMode(newMode);
  };

  return (
    <div className="min-h-screen w-full flex bg-white dark:bg-[#0A0A0A] text-[#0A0A0A] dark:text-white transition-colors duration-200 font-sans overflow-hidden">
      {/* 1. SOL KOLON: Giriş / Kayıt Kartı (~%22-25) */}
      <div className="w-full lg:w-[320px] xl:w-[360px] flex-shrink-0 flex flex-col justify-between p-6 sm:p-8 bg-white dark:bg-[#0A0A0A] border-r border-black/[0.06] dark:border-white/[0.08] z-20 shadow-sm relative">
        {/* Top Header: Logo & Theme Switch */}
        <div className="flex items-center justify-between mb-8">
          <div
            onClick={onNavigateHome}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-7 h-7 rounded-full bg-[#0A0A0A] text-white dark:bg-white dark:text-[#0A0A0A] font-mono flex items-center justify-center font-bold text-xs shadow-xs group-hover:scale-105 transition-transform">
              A
            </div>
            <span className="text-xs font-semibold tracking-tight">rnd-paper-canvas</span>
          </div>

          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-full border border-black/[0.08] dark:border-white/[0.1] text-black/60 dark:text-white/60 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors"
            title={isDark ? 'Açık Mod' : 'Koyu Mod'}
          >
            {isDark ? (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
        </div>

        {/* Center: Animated Form Container */}
        <div className="my-auto py-4">
          <AnimatePresence mode="wait">
            {mode === 'login' ? (
              <motion.div
                key="login-form"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
              >
                <div className="mb-6">
                  <h1 className="font-serif text-3xl font-medium tracking-tight text-[#0A0A0A] dark:text-white">
                    Giriş Yap
                  </h1>
                  <p className="text-xs text-black/50 dark:text-white/50 mt-1.5 leading-relaxed">
                    Araştırma çalışma alanınıza ve projelerinize erişin.
                  </p>
                </div>

                {errorMsg && (
                  <div className="mb-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-xs text-rose-600 dark:text-rose-400 font-mono">
                    {errorMsg}
                  </div>
                )}

                <form onSubmit={handleLoginSubmit} className="space-y-4">
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
                      Şifre
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

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 px-5 rounded-full text-xs font-medium text-white bg-[#0A0A0A] dark:bg-white dark:text-[#0A0A0A] hover:opacity-90 transition-all shadow-xs disabled:opacity-50 mt-2"
                  >
                    {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
                  </button>
                </form>

                <div className="mt-6 text-center text-xs text-black/50 dark:text-white/50">
                  <span>Hesabınız yok mu? </span>
                  <button
                    type="button"
                    onClick={() => toggleMode('signup')}
                    className="text-[#0A0A0A] dark:text-white font-medium hover:underline ml-0.5"
                  >
                    Kayıt Olun
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="signup-form"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
              >
                <div className="mb-6">
                  <h1 className="font-serif text-3xl font-medium tracking-tight text-[#0A0A0A] dark:text-white">
                    Hesap Oluştur
                  </h1>
                  <p className="text-xs text-black/50 dark:text-white/50 mt-1.5 leading-relaxed">
                    Akademik araştırma atlasınızı hemen başlatın.
                  </p>
                </div>

                {errorMsg && (
                  <div className="mb-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-xs text-rose-600 dark:text-rose-400 font-mono">
                    {errorMsg}
                  </div>
                )}

                {successMsg && (
                  <div className="mb-4 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-xs text-emerald-600 dark:text-emerald-400 font-mono">
                    {successMsg}
                  </div>
                )}

                <form onSubmit={handleSignupSubmit} className="space-y-3.5">
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
                      Şifre (En az 6 karakter)
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
                    className="w-full py-2.5 px-5 rounded-full text-xs font-medium text-white bg-[#0A0A0A] dark:bg-white dark:text-[#0A0A0A] hover:opacity-90 transition-all shadow-xs disabled:opacity-50 mt-1"
                  >
                    {loading ? 'Kayıt Olunuyor...' : 'Kayıt Ol'}
                  </button>
                </form>

                <div className="mt-6 text-center text-xs text-black/50 dark:text-white/50">
                  <span>Zaten hesabınız var mı? </span>
                  <button
                    type="button"
                    onClick={() => toggleMode('login')}
                    className="text-[#0A0A0A] dark:text-white font-medium hover:underline ml-0.5"
                  >
                    Giriş Yapın
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Wordmark */}
        <div className="pt-4 border-t border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between text-[11px] text-black/40 dark:text-white/40 font-mono">
          <span>v1.0 · Atlas</span>
          {onNavigateHome && (
            <button
              onClick={onNavigateHome}
              className="hover:underline text-black/60 dark:text-white/60 font-sans"
            >
              &larr; Tanıtıma Dön
            </button>
          )}
        </div>
      </div>

      {/* 2. SAĞ ALAN: 3D Yüzen Cisim Kümesi (~%78) */}
      <div className="hidden lg:block flex-1 h-screen relative bg-black/[0.02] dark:bg-[#0A0A0A]">
        {/* Subtle decorative text in background */}
        <div className="absolute top-8 right-10 text-[11px] font-mono text-black/30 dark:text-white/30 tracking-wider pointer-events-none select-none z-10">
          SPATIAL KNOWLEDGE ATLAS
        </div>

        {/* 3D Canvas Scene */}
        <FloatingShapesScene isDark={isDark} />
      </div>
    </div>
  );
};
