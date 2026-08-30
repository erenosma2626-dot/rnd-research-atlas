import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, FileText, Sparkles, Moon, Sun, ArrowRight, CheckCircle2 } from 'lucide-react';
import { uploadAndProcess } from '../api/client';
import { useTheme } from '../theme/ThemeContext';

export const UploadPage: React.FC = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);

  const pipelineSteps = [
    'PDF Docling ile ayrıştırılıyor...',
    'Formüller taranıyor ve LaTeX koduna dönüştürülüyor...',
    '17 eksenli makale profili sınıflandırılıyor...',
    'ChromaDB semantik vektör indekslemesi yapılıyor...',
    'Akıllı slot doldurma ile rapor bölümleri üretiliyor...',
  ];

  const handleFileChange = (selectedFile: File) => {
    if (!selectedFile.name.toLowerCase().endsWith('.pdf')) {
      setError('Lütfen geçerli bir PDF dosyası seçin.');
      return;
    }
    setError(null);
    setFile(selectedFile);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleProcess = async () => {
    if (!file || isLoading) return;

    setIsLoading(true);
    setError(null);
    setStepIndex(0);

    const stepInterval = setInterval(() => {
      setStepIndex((prev) => (prev < pipelineSteps.length - 1 ? prev + 1 : prev));
    }, 4000);

    try {
      const response = await uploadAndProcess(file);
      clearInterval(stepInterval);
      navigate('/report', { state: { pipelineData: response, fileName: file.name } });
    } catch (err: any) {
      clearInterval(stepInterval);
      setError(err?.message || 'İşlem sırasında bir hata oluştu.');
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-bg-light dark:bg-bg-dark flex flex-col justify-between p-6 transition-colors duration-apple">
      {/* Top Navbar */}
      <header className="max-w-5xl w-full mx-auto flex items-center justify-between py-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center text-white font-bold text-sm shadow-sm">
            α
          </div>
          <div>
            <h1 className="text-base font-semibold text-text-primary-light dark:text-text-primary-dark tracking-tight">
              rnd-paper-canvas
            </h1>
            <p className="text-[11px] text-text-secondary-light dark:text-text-secondary-dark">
              ArGe Araştırma ve Analiz Atlası
            </p>
          </div>
        </div>

        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark transition-all duration-apple shadow-sm"
          aria-label="Tema Değiştir"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-accent" />}
        </button>
      </header>

      {/* Main Upload Center */}
      <div className="max-w-xl w-full mx-auto my-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-text-primary-light dark:text-text-primary-dark tracking-tight mb-3">
            Akademik Makaleyi Analiz Et
          </h2>
          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark leading-relaxed max-w-md mx-auto">
            Matematik, ML/AI ve Data Science makalelerinizi yapılandırılmış raporlara, akış diyagramlarına ve doğrulanmış LaTeX formüllerine dönüştürün.
          </p>
        </div>

        {/* Upload Container */}
        <div className="p-8 rounded-2xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark shadow-subtle transition-all duration-apple">
          {!isLoading ? (
            <>
              {/* Dropzone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`cursor-pointer border-2 border-dashed rounded-xl p-10 text-center transition-all duration-apple flex flex-col items-center justify-center ${
                  isDragging
                    ? 'border-accent bg-accent/5'
                    : 'border-border-light dark:border-border-dark hover:border-accent/60 bg-bg-light/40 dark:bg-bg-dark/40'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
                />

                <div className="w-12 h-12 rounded-2xl bg-accent/10 text-accent flex items-center justify-center mb-4">
                  <UploadCloud className="w-6 h-6" />
                </div>

                <div className="text-sm font-semibold text-text-primary-light dark:text-text-primary-dark mb-1">
                  PDF Dosyasını Sürükleyip Bırakın
                </div>
                <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                  veya dosya seçmek için <span className="text-accent underline font-medium">göz atın</span>
                </p>
              </div>

              {/* Selected File Card */}
              {file && (
                <div className="mt-4 p-3.5 rounded-xl bg-bg-light dark:bg-bg-dark border border-border-light dark:border-border-dark flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="w-5 h-5 text-accent shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-text-primary-light dark:text-text-primary-dark truncate">
                        {file.name}
                      </div>
                      <div className="text-[10px] text-text-secondary-light dark:text-text-secondary-dark">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                      </div>
                    </div>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-xs">
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <button
                onClick={handleProcess}
                disabled={!file}
                className="mt-6 w-full py-3.5 px-6 rounded-xl bg-accent hover:bg-accent-hover text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-apple flex items-center justify-center gap-2 shadow-sm"
              >
                <Sparkles className="w-4 h-4" />
                <span>Analizi Başlat</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          ) : (
            /* Loading State */
            <div className="py-10 text-center space-y-6">
              <div className="relative w-14 h-14 mx-auto">
                <div className="w-14 h-14 rounded-full border-3 border-accent/20 border-t-accent animate-spin" />
                <Sparkles className="w-6 h-6 text-accent absolute inset-0 m-auto animate-pulse" />
              </div>

              <div>
                <h2 className="text-base font-semibold text-text-primary-light dark:text-text-primary-dark mb-1">
                  {pipelineSteps[stepIndex]}
                </h2>
                <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                  Bu işlem makalenin uzunluğuna bağlı olarak 15-45 saniye sürebilir.
                </p>
              </div>

              {/* Progress Steps Indicator */}
              <div className="max-w-xs mx-auto space-y-2 pt-2">
                {pipelineSteps.map((step, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs">
                    <div
                      className={`w-2 h-2 rounded-full transition-colors duration-apple ${
                        idx < stepIndex
                          ? 'bg-emerald-500'
                          : idx === stepIndex
                          ? 'bg-accent animate-ping'
                          : 'bg-border-light dark:bg-border-dark'
                      }`}
                    />
                    <span
                      className={`truncate ${
                        idx <= stepIndex
                          ? 'text-text-primary-light dark:text-text-primary-dark font-medium'
                          : 'text-text-secondary-light dark:text-text-secondary-dark opacity-50'
                      }`}
                    >
                      {step}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center py-4 text-xs text-text-secondary-light dark:text-text-secondary-dark">
        Faz 1 Prototip · React · KaTeX · Mermaid · Groq
      </footer>
    </main>
  );
};
