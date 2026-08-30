import React from 'react';
import { ArrowRight, BookOpen, Network, Sparkles, Zap, Layers } from 'lucide-react';
import { Domain3DCanvas, DomainType } from '../components/3d/Domain3DCanvas';
import { useTheme } from '../theme/ThemeContext';

interface LandingPageProps {
  onNavigateLogin: () => void;
}

const DOMAINS: Array<{
  id: DomainType;
  title: string;
  badge: string;
  description: string;
  highlights: string[];
}> = [
  {
    id: 'math',
    title: 'Matematik ve Kuramsal Temeller',
    badge: 'Teori & İspat',
    description:
      'Karmaşık teorem, lemma ve ispat hiyerarşisini otomatik ayrıştırır. Sembolik notasyonları ve denklemleri LaTeX formatında eksiksiz yakalar.',
    highlights: ['Otomatik LaTeX Formül Çıkarma', 'Teorem & İspat Blok Tespiti', 'Notasyonel Tutarlılık'],
  },
  {
    id: 'ml',
    title: 'Makine Öğrenmesi & Algoritmalar',
    badge: 'Model & Mimari',
    description:
      'Yapay sinir ağı mimarilerini, hiperparametre tablolarını ve ablasyon çalışmalarını karşılaştırmalı özet tablolarına dönüştürür.',
    highlights: ['Ablasyon Çalışmaları', 'Model Mimarisi Ayrıştırma', 'Metrik Karşılaştırma Tabloları'],
  },
  {
    id: 'ai',
    title: 'Yapay Zeka & Büyük Dil Modelleri',
    badge: 'RAG & Ajanlar',
    description:
      'Makaleyi vektör uzayına indeksler. Entegre RAG sohbet asistanı sayesinde doğrudan sayfa referanslarıyla soru-cevap imkanı sunar.',
    highlights: ['Doğrulanmış Sayfa Referansları', 'Gelişmiş Vektör Arama', 'Etkileşimli Araştırma Asistanı'],
  },
  {
    id: 'data',
    title: 'Veri Bilimi ve Deneysel İstatistik',
    badge: 'Veri & Deney',
    description:
      'Veri seti dağılımlarını, ön işleme adımlarını ve kıyaslama (benchmark) sonuçlarını yapılandırılmış veri bloklarına aktarır.',
    highlights: ['Veri Seti Şemaları', 'Benchmark Analizleri', 'İstatistiksel Dağılım Çıkarımı'],
  },
];

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigateLogin }) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-white dark:bg-[#0A0A0A] text-[#0A0A0A] dark:text-white transition-colors duration-200 font-sans selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black">
      {/* Subtle background grid pattern */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.04]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }}
      />

      {/* Sticky Header */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-white/80 dark:bg-[#0A0A0A]/80 border-b border-black/[0.06] dark:border-white/[0.08]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#0A0A0A] text-white dark:bg-white dark:text-[#0A0A0A] flex items-center justify-center font-bold text-xs shadow-xs">
              A
            </div>
            <span className="text-sm font-semibold tracking-tight">rnd-paper-canvas</span>
          </div>

          <div className="flex items-center gap-3">
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

            <button
              onClick={onNavigateLogin}
              className="px-5 py-2 rounded-full text-xs font-medium text-white bg-[#0A0A0A] dark:bg-white dark:text-[#0A0A0A] hover:opacity-90 transition-all shadow-xs"
            >
              Giriş Yap
            </button>
          </div>
        </div>
      </header>

      {/* 1. HERO SECTION */}
      <section className="max-w-4xl mx-auto px-6 pt-24 pb-20 text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-black/[0.03] dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/[0.08] text-xs text-black/70 dark:text-white/70 mb-8 font-medium">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Akademik Araştırma ve Sentez Atlası</span>
        </div>

        <h1 className="font-serif text-5xl sm:text-7xl font-medium tracking-tight text-[#0A0A0A] dark:text-white leading-[1.05] mb-6 max-w-3xl mx-auto">
          Makaleleri oku, biz yapılandıralım.
        </h1>

        <p className="text-base sm:text-lg text-black/60 dark:text-white/60 max-w-xl mx-auto mb-10 leading-relaxed font-sans">
          Karmaşık akademik PDF’leri Docling ile ayrıştırın, formülleri otomatik LaTeX'e dönüştürün ve sonsuz tuvalde ekipçe sentezleyin.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={onNavigateLogin}
            className="flex items-center gap-2.5 px-7 py-3.5 rounded-full text-sm font-medium text-white bg-[#0A0A0A] dark:bg-white dark:text-[#0A0A0A] hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_8px_30px_rgba(0,0,0,0.12)]"
          >
            <span>Çalışma Alanına Başla</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* 2. SECTION A: Ne Yapıyoruz (Problem & Çözüm) */}
      <section className="max-w-5xl mx-auto px-6 py-20 border-t border-black/[0.05] dark:border-white/[0.08]">
        <div className="text-center mb-14">
          <h2 className="font-serif text-3xl sm:text-4xl font-medium tracking-tight text-[#0A0A0A] dark:text-white">
            Akademik Okumayı Zahmetsiz Kılın
          </h2>
          <p className="text-sm text-black/55 dark:text-white/55 mt-2 max-w-lg mx-auto">
            Dağınık sayfalar, gözden kaçan detaylar ve karmaşık denklemler arasında kaybolmayın.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-8 rounded-3xl bg-white dark:bg-[#141414] border border-black/[0.06] dark:border-white/[0.08] hover:border-black/20 dark:hover:border-white/20 shadow-xs hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-200">
            <div className="w-10 h-10 rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] text-[#0A0A0A] dark:text-white flex items-center justify-center mb-5 font-mono text-sm font-bold">
              01
            </div>
            <h3 className="font-serif text-xl font-medium mb-2 tracking-tight">Yapılandırılmış Rapor</h3>
            <p className="text-xs text-black/60 dark:text-white/60 leading-relaxed">
              Her makalenin türüne göre dinamik slotlar oluşturulur. Teorem, model mimarisi veya veri seti bilgileri otomatik sınıflandırılır.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-white dark:bg-[#141414] border border-black/[0.06] dark:border-white/[0.08] hover:border-black/20 dark:hover:border-white/20 shadow-xs hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-200">
            <div className="w-10 h-10 rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] text-[#0A0A0A] dark:text-white flex items-center justify-center mb-5 font-mono text-sm font-bold">
              02
            </div>
            <h3 className="font-serif text-xl font-medium mb-2 tracking-tight">Hassas LaTeX Çıkarımı</h3>
            <p className="text-xs text-black/60 dark:text-white/60 leading-relaxed">
              Metin içi ve blok formüller Nougat ve görme modelleriyle anında LaTeX'e çevrilir, KaTeX ile net şekilde çizilir.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-white dark:bg-[#141414] border border-black/[0.06] dark:border-white/[0.08] hover:border-black/20 dark:hover:border-white/20 shadow-xs hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-200">
            <div className="w-10 h-10 rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] text-[#0A0A0A] dark:text-white flex items-center justify-center mb-5 font-mono text-sm font-bold">
              03
            </div>
            <h3 className="font-serif text-xl font-medium mb-2 tracking-tight">Sonsuz Canvas Tuvali</h3>
            <p className="text-xs text-black/60 dark:text-white/60 leading-relaxed">
              Birden fazla makaleyi ve notu React Flow tabanlı tuvale sürükleyin, aralarında bağlantılar ve karşılaştırmalar kurun.
            </p>
          </div>
        </div>
      </section>

      {/* 3. SECTION B: Nasıl Çalışıyor (4 Adım) */}
      <section className="max-w-5xl mx-auto px-6 py-20 border-t border-black/[0.05] dark:border-white/[0.08]">
        <div className="text-center mb-14">
          <h2 className="font-serif text-3xl sm:text-4xl font-medium tracking-tight text-[#0A0A0A] dark:text-white">
            Nasıl Çalışır?
          </h2>
          <p className="text-sm text-black/55 dark:text-white/55 mt-2">
            Yüklemeden görsel senteze 4 adımlı akıllı akış
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="p-6 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.08]">
            <div className="w-9 h-9 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] flex items-center justify-center mb-4">
              <BookOpen className="w-4 h-4 text-[#0A0A0A] dark:text-white" />
            </div>
            <span className="text-[11px] font-mono text-black/40 dark:text-white/40">Adım 01</span>
            <h4 className="font-medium text-sm text-[#0A0A0A] dark:text-white mt-1 mb-1.5">PDF Yükleyin</h4>
            <p className="text-xs text-black/55 dark:text-white/55">
              İncelemek istediğiniz araştırma makalesini sürükleyip bırakın.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.08]">
            <div className="w-9 h-9 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] flex items-center justify-center mb-4">
              <Zap className="w-4 h-4 text-[#0A0A0A] dark:text-white" />
            </div>
            <span className="text-[11px] font-mono text-black/40 dark:text-white/40">Adım 02</span>
            <h4 className="font-medium text-sm text-[#0A0A0A] dark:text-white mt-1 mb-1.5">Asenkron Analiz</h4>
            <p className="text-xs text-black/55 dark:text-white/55">
              5 aşamalı pipeline makaleyi ayrıştırır ve formülleri derler.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.08]">
            <div className="w-9 h-9 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] flex items-center justify-center mb-4">
              <Layers className="w-4 h-4 text-[#0A0A0A] dark:text-white" />
            </div>
            <span className="text-[11px] font-mono text-black/40 dark:text-white/40">Adım 03</span>
            <h4 className="font-medium text-sm text-[#0A0A0A] dark:text-white mt-1 mb-1.5">Rapor & Soru-Cevap</h4>
            <p className="text-xs text-black/55 dark:text-white/55">
              Yapılandırılmış raporu inceleyin, RAG asistanına sorular sorun.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.08]">
            <div className="w-9 h-9 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] flex items-center justify-center mb-4">
              <Network className="w-4 h-4 text-[#0A0A0A] dark:text-white" />
            </div>
            <span className="text-[11px] font-mono text-black/40 dark:text-white/40">Adım 04</span>
            <h4 className="font-medium text-sm text-[#0A0A0A] dark:text-white mt-1 mb-1.5">Canvas ile Sentez</h4>
            <p className="text-xs text-black/55 dark:text-white/55">
              Çoklu makaleleri harita üzerinde birbirine bağlayarak büyük resmi görün.
            </p>
          </div>
        </div>
      </section>

      {/* 4. SECTION C: Disiplin Bazlı Scroll-Linked 3D Alan Tanıtımı */}
      <section className="max-w-5xl mx-auto px-6 py-20 border-t border-black/[0.05] dark:border-white/[0.08]">
        <div className="text-center mb-16">
          <h2 className="font-serif text-3xl sm:text-4xl font-medium tracking-tight text-[#0A0A0A] dark:text-white">
            Tüm Araştırma Disiplinlerine Uyumlu
          </h2>
          <p className="text-sm text-black/55 dark:text-white/55 mt-2">
            Farklı alanların kendine has makale yapılarına özel uyarlamalar
          </p>
        </div>

        <div className="space-y-16">
          {DOMAINS.map((domain, index) => (
            <div
              key={domain.id}
              className={`flex flex-col ${
                index % 2 === 1 ? 'md:flex-row-reverse' : 'md:flex-row'
              } items-center justify-between gap-10 p-8 sm:p-12 rounded-3xl bg-white dark:bg-[#141414] border border-black/[0.06] dark:border-white/[0.08] shadow-sm`}
            >
              {/* 3D Canvas Container */}
              <div className="w-full md:w-1/2 flex items-center justify-center">
                <Domain3DCanvas domain={domain.id} isDark={isDark} size={320} />
              </div>

              {/* Description Content */}
              <div className="w-full md:w-1/2 space-y-4">
                <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-black/[0.04] dark:bg-white/[0.06] text-[#0A0A0A] dark:text-white border border-black/[0.06] dark:border-white/[0.08]">
                  {domain.badge}
                </span>

                <h3 className="font-serif text-3xl font-medium tracking-tight text-[#0A0A0A] dark:text-white">
                  {domain.title}
                </h3>

                <p className="text-sm text-black/60 dark:text-white/60 leading-relaxed font-sans">
                  {domain.description}
                </p>

                <div className="pt-2 space-y-2">
                  {domain.highlights.map((item, hIdx) => (
                    <div key={hIdx} className="flex items-center gap-2.5 text-xs text-black/75 dark:text-white/75 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#0A0A0A] dark:bg-white" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Call to Action Bar */}
      <section className="max-w-4xl mx-auto px-6 py-20 text-center border-t border-black/[0.05] dark:border-white/[0.08]">
        <h2 className="font-serif text-3xl sm:text-4xl font-medium tracking-tight mb-4">
          Araştırmanızı Bir Üst Seviyeye Taşıyın
        </h2>
        <p className="text-sm text-black/55 dark:text-white/55 mb-8 max-w-md mx-auto">
          Ekibinizle birlikte makaleleri analiz etmek ve sonsuz tuvalde düzenlemek için ücretsiz başlayın.
        </p>
        <button
          onClick={onNavigateLogin}
          className="px-8 py-3.5 rounded-full text-sm font-medium text-white bg-[#0A0A0A] dark:bg-white dark:text-[#0A0A0A] hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-sm"
        >
          Hemen Başlayın &rarr;
        </button>
      </section>

      {/* Minimalist Footer */}
      <footer className="border-t border-black/[0.05] dark:border-white/[0.08] py-8 text-center text-xs text-black/40 dark:text-white/40 font-mono">
        rnd-paper-canvas · Akademik Araştırma Atlası
      </footer>
    </div>
  );
};
