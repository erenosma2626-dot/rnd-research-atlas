import React, { useState } from 'react';
import { uploadDocument } from '../api/client';
import { useTheme } from '../theme/ThemeContext';

interface UploadPageProps {
  projectId?: string;
  onUploadSuccess: (documentId: string, filename: string) => void;
  onNavigateHome: () => void;
}

export const UploadPage: React.FC<UploadPageProps> = ({
  projectId,
  onUploadSuccess,
  onNavigateHome,
}) => {
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
      const response = await uploadDocument(file, projectId);
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
    <main className="min-h-screen flex flex-col justify-between bg-white dark:bg-[#0A0A0A] text-[#0A0A0A] dark:text-white transition-colors duration-200 font-sans">
      {/* Top Sticky Glassmorphic Navbar */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-white/80 dark:bg-[#0A0A0A]/80 border-b border-black/[0.06] dark:border-white/[0.08]">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onNavigateHome}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-black/[0.08] dark:border-white/[0.1] text-black/60 dark:text-white/60 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] text-xs font-medium transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Projeye Dön
            </button>
            <div className="h-4 w-px bg-black/[0.08] dark:bg-white/[0.1]" />
            <span className="font-serif text-base font-semibold tracking-tight text-[#0A0A0A] dark:text-white">
              PaperCanvas
            </span>
          </div>

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
      </header>

      {/* Main Upload Body */}
      <section className="w-full max-w-2xl mx-auto px-6 py-14 flex flex-col items-center justify-center flex-1">
        <div className="text-center mb-10">
          <h2 className="font-serif text-4xl sm:text-5xl font-medium tracking-tight mb-3 text-[#0A0A0A] dark:text-white leading-[1.1]">
            Akademik Makale Analizi
          </h2>
          <p className="text-sm text-black/50 dark:text-white/50 max-w-md mx-auto leading-relaxed">
            PDF dosyanızı yükleyin; arka planda asenkron olarak sınıflandırma, formül çıkarma ve yapılandırılmış rapor oluşturulsun.
          </p>
        </div>

        {/* Dropzone Container */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`w-full relative p-12 sm:p-16 rounded-3xl border border-dashed transition-all duration-200 flex flex-col items-center justify-center text-center cursor-pointer bg-white dark:bg-[#141414] shadow-sm ${
            isDragging
              ? 'border-[#0A0A0A] dark:border-white bg-black/[0.02] dark:bg-white/[0.02] scale-[1.01]'
              : 'border-black/[0.12] dark:border-white/[0.16] hover:border-black/30 dark:hover:border-white/30 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)]'
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
          <div className="w-14 h-14 rounded-full bg-black/[0.04] dark:bg-white/[0.06] text-[#0A0A0A] dark:text-white flex items-center justify-center mb-5 transition-transform duration-200">
            {isUploading ? (
              <svg className="w-7 h-7 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            ) : (
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            )}
          </div>

          <h3 className="font-serif text-xl font-medium mb-1 tracking-tight">
            {isUploading ? 'Dosya aktarılıyor ve sıraya alınıyor...' : 'PDF dosyasını buraya sürükleyin'}
          </h3>
          <p className="text-xs text-black/50 dark:text-white/50 mb-5">
            veya cihazınızdan seçmek için tıklayın
          </p>

          <span className="text-[11px] text-black/40 dark:text-white/40 bg-black/[0.03] dark:bg-white/[0.05] px-4 py-1 rounded-full border border-black/[0.05] dark:border-white/[0.08] font-mono">
            Maksimum 50 MB · .pdf formatında
          </span>
        </div>

        {/* Error message */}
        {error && (
          <div className="mt-6 w-full p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 text-xs text-center font-mono">
            {error}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="text-center py-6 text-xs text-black/40 dark:text-white/40 font-mono">
        Docling · Groq 20B · ChromaDB · LaTeX
      </footer>
    </main>
  );
};
