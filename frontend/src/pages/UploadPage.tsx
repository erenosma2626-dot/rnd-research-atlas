import React, { useState } from 'react';
import { uploadDocument } from '../api/client';
import { useTheme } from '../theme/ThemeContext';

interface UploadPageProps {
  onUploadSuccess: (documentId: string, filename: string) => void;
  onNavigateHome: () => void;
}

export const UploadPage: React.FC<UploadPageProps> = ({ onUploadSuccess, onNavigateHome }) => {
  const { isDark, toggleTheme } = useTheme();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('Lütfen yalnızca PDF formatında bir dosya yükleyin.');
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      const response = await uploadDocument(file);
      onUploadSuccess(response.document_id, file.name);
    } catch (err: any) {
      setError(err.message || 'Dosya yükleme sırasında bir hata oluştu.');
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <main className="min-h-screen flex flex-col justify-between bg-bg-light dark:bg-bg-dark text-text-primary-light dark:text-text-primary-dark transition-colors duration-200">
      {/* Top Navbar */}
      <header className="w-full max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onNavigateHome}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-card-border-light dark:border-card-border-dark text-text-secondary-light dark:text-text-secondary-dark hover:bg-card-bg-light dark:hover:bg-card-bg-dark text-xs font-medium transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Projeye Dön
          </button>
          <span className="text-sm font-semibold tracking-tight">rnd-paper-canvas</span>
        </div>

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
      </header>

      {/* Main Upload Body */}
      <section className="w-full max-w-2xl mx-auto px-6 py-12 flex flex-col items-center justify-center flex-1">
        <div className="text-center mb-8">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
            Akademik Makale Analizi
          </h2>
          <p className="text-sm sm:text-base text-text-secondary-light dark:text-text-secondary-dark max-w-md mx-auto">
            PDF dosyanızı yükleyin; arka planda asenkron olarak sınıflandırma, formül çıkarma ve yapılandırılmış rapor oluşturulsun.
          </p>
        </div>

        {/* Dropzone Container */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`w-full relative p-10 sm:p-14 rounded-3xl border-2 border-dashed transition-all duration-200 flex flex-col items-center justify-center text-center cursor-pointer bg-card-bg-light dark:bg-card-bg-dark shadow-card ${
            isDragging
              ? 'border-accent bg-blue-50/50 dark:bg-blue-950/20 scale-[1.01]'
              : 'border-card-border-light dark:border-card-border-dark hover:border-accent/40 hover:shadow-card-hover'
          }`}
          onClick={() => document.getElementById('file-input')?.click()}
        >
          <input
            id="file-input"
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={handleFileInputChange}
            disabled={isUploading}
          />

          {/* Icon */}
          <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-accent flex items-center justify-center mb-5 transition-transform duration-200 group-hover:scale-105">
            {isUploading ? (
              <svg className="w-8 h-8 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            ) : (
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            )}
          </div>

          <h3 className="text-base font-semibold mb-1">
            {isUploading ? 'Dosya MinIO ve kuyruğa aktarılıyor...' : 'PDF dosyasını buraya sürükleyin'}
          </h3>
          <p className="text-xs sm:text-sm text-text-secondary-light dark:text-text-secondary-dark mb-4">
            veya bilgisayarınızdan seçmek için tıklayın
          </p>

          <span className="text-xs text-text-secondary-light/80 dark:text-text-secondary-dark/80 bg-bg-light dark:bg-bg-dark px-3 py-1 rounded-full border border-card-border-light dark:border-card-border-dark">
            Maksimum 50 MB · Yalnızca .pdf
          </span>
        </div>

        {/* Error message */}
        {error && (
          <div className="mt-6 w-full p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs sm:text-sm text-center">
            {error}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="text-center py-4 text-xs text-text-secondary-light dark:text-text-secondary-dark">
        Faz 2 · Celery & Redis Asenkron İşlem · PostgreSQL · MinIO
      </footer>
    </main>
  );
};
