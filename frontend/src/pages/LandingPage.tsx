import React from 'react';
import {
  ArrowRight,
  LayoutGrid,
  ListChecks,
  ScanSearch,
  Sparkles,
  Upload,
} from 'lucide-react';
import { BlockMath, InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';
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
      'Teorem, lemma ve ispat hiyerarşisini otomatik ayrıştırır. Matematiksel notasyonu ve denklemleri LaTeX formatında eksiksiz yakalar.',
    highlights: [
      'Otomatik LaTeX Formül Çıkarma',
      'Teorem & İspat Blok Tespiti',
      'Notasyonel Tutarlılık',
    ],
  },
  {
    id: 'ml',
    title: 'Makine Öğrenmesi & Algoritmalar',
    badge: 'Model & Mimari',
    description:
      'Yapay sinir ağı mimarilerini, hiperparametre tablolarını ve ablasyon çalışmalarını karşılaştırmalı özet tablolarına dönüştürür.',
    highlights: [
      'Ablasyon Çalışmaları',
      'Model Mimarisi Ayrıştırma',
      'Metrik Karşılaştırma Tabloları',
    ],
  },
  {
    id: 'ai',
    title: 'Yapay Zeka Sistemleri',
    badge: 'Sistem & Mimari',
    description:
      'Sistem mimarilerini, veri akış şemalarını ve deneysel sonuçları modüler bir yapıya böler; her bileşeni ayrı ayrı takip edilebilir kılar.',
    highlights: [
      'Sistem Mimarisi Modülerleştirme',
      'Deneysel Sonuç Grafikleri',
      'Karar Ağacı / Akış Tespiti',
    ],
  },
  {
    id: 'data',
    title: 'Veri Bilimi & İstatistik',
    badge: 'Veri & Deney',
    description:
      'Veri setlerini, ön işleme adımlarını ve istatistiksel değerlendirme metriklerini gerçek grafik ve tablolara dönüştürür.',
    highlights: [
      'Veri Seti & Ön İşleme Özeti',
      'İstatistiksel Değerlendirme Tabloları',
      'Sayısal Sonuç Grafikleri',
    ],
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
          <span className="font-serif text-lg font-semibold tracking-tight text-[#0A0A0A] dark:text-white">
            PaperCanvas
          </span>

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
      <section className="max-w-4xl mx-auto px-6 pt-24 pb-16 text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/[0.03] dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/[0.08] text-xs text-black/70 dark:text-white/70 mb-8 font-medium">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Akademik Araştırma ve Sentez Atlası</span>
        </div>

        <h1 className="font-serif text-5xl sm:text-7xl font-medium tracking-tight text-[#0A0A0A] dark:text-white leading-[1.05] mb-6 max-w-3xl mx-auto">
          Okumadan önce, anlamak için.
        </h1>

        <p className="text-base sm:text-lg text-black/60 dark:text-white/60 max-w-xl mx-auto mb-10 leading-relaxed font-sans">
          Akademik makaleleri otomatik analiz eden, ortak yapıları yakalayan ve canvas üzerinde organize etmeni sağlayan bir ArGe aracı.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={onNavigateLogin}
            className="flex items-center gap-2.5 px-8 py-3.5 rounded-full text-sm font-medium text-white bg-[#0A0A0A] dark:bg-white dark:text-[#0A0A0A] hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_8px_30px_rgba(0,0,0,0.12)]"
          >
            <span>Başla</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* 5.A: SOMUT ÇIKTI ÖNİZLEMESİ (Hero Altı Mockup) */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <div className="rounded-3xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#141414] shadow-[0_12px_40px_rgba(0,0,0,0.06)] overflow-hidden">
          {/* Mockup Window Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-black/[0.05] dark:border-white/[0.07] bg-black/[0.02] dark:bg-white/[0.02]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" />
              <span className="ml-2 text-[11px] font-mono text-black/40 dark:text-white/40">
                paper_analysis_report.pdf &rarr; Yapılandırılmış Çıktı
              </span>
            </div>
            <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-medium">
              Analiz Tamamlandı
            </span>
          </div>

          {/* Mockup Window Body */}
          <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.05] dark:border-white/[0.06] space-y-2">
              <div className="text-[10px] font-mono text-black/40 dark:text-white/40">BÖLÜM 01 · YÖNTEM</div>
              <h4 className="font-serif text-sm font-semibold text-[#0A0A0A] dark:text-white">Çok Katmanlı Dikkat Mekanizması</h4>
              <p className="text-[11px] text-black/60 dark:text-white/60 leading-relaxed">
                Girdi dizileri <InlineMath math="Q, K, V" /> matrisleri üzerinden lineer projeksiyonla alt uzaylara ayrıştırılır.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.05] dark:border-white/[0.06] space-y-2">
              <div className="text-[10px] font-mono text-black/40 dark:text-white/40">BÖLÜM 02 · FORMÜL & LATEX</div>
              <h4 className="font-serif text-sm font-semibold text-[#0A0A0A] dark:text-white">Ölçekli Çarpım Fonksiyonu</h4>
              <div className="text-[11px] p-2 rounded-lg bg-black/[0.03] dark:bg-white/[0.05] text-black/90 dark:text-white/90 overflow-x-auto select-all flex items-center justify-center">
                <BlockMath math="\text{Attention}(Q, K, V) = \text{softmax}\left(\frac{QK^T}{\sqrt{d_k}}\right)V" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.05] dark:border-white/[0.06] space-y-2">
              <div className="text-[10px] font-mono text-black/40 dark:text-white/40">BÖLÜM 03 · BULGULAR & TABLO</div>
              <h4 className="font-serif text-sm font-semibold text-[#0A0A0A] dark:text-white">Benchmark Başarımı</h4>
              <div className="text-[11px] font-mono space-y-1">
                <div className="flex justify-between py-0.5 border-b border-black/[0.05] dark:border-white/[0.06] text-black/50 dark:text-white/50">
                  <span>Model</span>
                  <span>BLEU</span>
                </div>
                <div className="flex justify-between py-0.5 text-black/80 dark:text-white/80 font-medium">
                  <span>Önerilen Model</span>
                  <span className="text-emerald-600 dark:text-emerald-400">41.8</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. SECTION A: Neden Bu Araç Var */}
      <section className="max-w-4xl mx-auto px-6 py-20 border-t border-black/[0.05] dark:border-white/[0.08]">
        <div className="text-center mb-12">
          <h2 className="font-serif text-3xl sm:text-4xl font-medium tracking-tight text-[#0A0A0A] dark:text-white">
            Neden bu araç var
          </h2>
        </div>

        <div className="space-y-4 max-w-2xl mx-auto">
          <div className="flex items-start gap-4 p-5 rounded-2xl bg-white dark:bg-[#141414] border border-black/[0.06] dark:border-white/[0.08]">
            <span className="w-2 h-2 rounded-full bg-[#0A0A0A] dark:bg-white mt-2 shrink-0" />
            <p className="text-sm text-black/75 dark:text-white/75 leading-relaxed font-sans">
              Aynı formatta düzinelerce makale okumak zaman alıyor; her seferinde yöntemi, veri setini, sonuçları elle bulup çıkarmak gerekiyor.
            </p>
          </div>

          <div className="flex items-start gap-4 p-5 rounded-2xl bg-white dark:bg-[#141414] border border-black/[0.06] dark:border-white/[0.08]">
            <span className="w-2 h-2 rounded-full bg-[#0A0A0A] dark:bg-white mt-2 shrink-0" />
            <p className="text-sm text-black/75 dark:text-white/75 leading-relaxed font-sans">
              Bu araç makaleyi okuyup kendi anlatı akışına göre bölüyor, ortak desenleri (yöntem, deney, teorem, karşılaştırma) otomatik yakalıyor.
            </p>
          </div>

          <div className="flex items-start gap-4 p-5 rounded-2xl bg-white dark:bg-[#141414] border border-black/[0.06] dark:border-white/[0.08]">
            <span className="w-2 h-2 rounded-full bg-[#0A0A0A] dark:bg-white mt-2 shrink-0" />
            <p className="text-sm text-black/75 dark:text-white/75 leading-relaxed font-sans">
              Sonuç: makalenin kendi görselleriyle, tablolarıyla ve öne çıkan bulgularıyla birlikte, düzenli ve taranabilir bir rapor.
            </p>
          </div>
        </div>
      </section>

      {/* 3. SECTION B: Nasıl Çalışıyor (4 Adım) */}
      <section className="max-w-5xl mx-auto px-6 py-20 border-t border-black/[0.05] dark:border-white/[0.08]">
        <div className="text-center mb-14">
          <h2 className="font-serif text-3xl sm:text-4xl font-medium tracking-tight text-[#0A0A0A] dark:text-white">
            Nasıl çalışıyor
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="p-6 rounded-2xl bg-white dark:bg-[#141414] border border-black/[0.06] dark:border-white/[0.08] shadow-xs">
            <div className="w-9 h-9 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] flex items-center justify-center mb-4">
              <Upload className="w-4 h-4 text-[#0A0A0A] dark:text-white" />
            </div>
            <span className="text-[11px] font-mono text-black/40 dark:text-white/40">Adım 01</span>
            <h4 className="font-medium text-sm text-[#0A0A0A] dark:text-white mt-1 mb-1.5">Makaleni yükle</h4>
            <p className="text-xs text-black/60 dark:text-white/60 leading-relaxed">
              PDF'i sürükle-bırak, gerisini biz hallederiz.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-[#141414] border border-black/[0.06] dark:border-white/[0.08] shadow-xs">
            <div className="w-9 h-9 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] flex items-center justify-center mb-4">
              <ScanSearch className="w-4 h-4 text-[#0A0A0A] dark:text-white" />
            </div>
            <span className="text-[11px] font-mono text-black/40 dark:text-white/40">Adım 02</span>
            <h4 className="font-medium text-sm text-[#0A0A0A] dark:text-white mt-1 mb-1.5">Otomatik analiz</h4>
            <p className="text-xs text-black/60 dark:text-white/60 leading-relaxed">
              Yöntem, bulgular, görseller ve tablolar tespit edilir.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-[#141414] border border-black/[0.06] dark:border-white/[0.08] shadow-xs">
            <div className="w-9 h-9 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] flex items-center justify-center mb-4">
              <ListChecks className="w-4 h-4 text-[#0A0A0A] dark:text-white" />
            </div>
            <span className="text-[11px] font-mono text-black/40 dark:text-white/40">Adım 03</span>
            <h4 className="font-medium text-sm text-[#0A0A0A] dark:text-white mt-1 mb-1.5">Planla ve onayla</h4>
            <p className="text-xs text-black/60 dark:text-white/60 leading-relaxed">
              Rapora hangi bölümlerin gireceğine sen karar verirsin.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-[#141414] border border-black/[0.06] dark:border-white/[0.08] shadow-xs">
            <div className="w-9 h-9 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] flex items-center justify-center mb-4">
              <LayoutGrid className="w-4 h-4 text-[#0A0A0A] dark:text-white" />
            </div>
            <span className="text-[11px] font-mono text-black/40 dark:text-white/40">Adım 04</span>
            <h4 className="font-medium text-sm text-[#0A0A0A] dark:text-white mt-1 mb-1.5">Canvas'ta organize et</h4>
            <p className="text-xs text-black/60 dark:text-white/60 leading-relaxed">
              Bölümleri sürükle, notlar ekle, bağlantı kur.
            </p>
          </div>
        </div>
      </section>

      {/* 4. SECTION C: Disiplin Bazlı 3D Alan Tanıtımı */}
      <section className="max-w-5xl mx-auto px-6 py-20 border-t border-black/[0.05] dark:border-white/[0.08]">
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

      {/* 5.B: Kapanış CTA'sı */}
      <section className="max-w-4xl mx-auto px-6 py-24 text-center border-t border-black/[0.05] dark:border-white/[0.08]">
        <h2 className="font-serif text-3xl sm:text-4xl font-medium tracking-tight mb-6">
          Bir makalen mi var? Dene.
        </h2>
        <button
          onClick={onNavigateLogin}
          className="px-8 py-3.5 rounded-full text-sm font-medium text-white bg-[#0A0A0A] dark:bg-white dark:text-[#0A0A0A] hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-sm"
        >
          Başla
        </button>
      </section>

      {/* 7. Sade Footer */}
      <footer className="border-t border-black/[0.05] dark:border-white/[0.08] py-8 text-center text-xs text-black/50 dark:text-white/50 font-mono">
        © 2026 · PaperCanvas ·{' '}
        <a
          href="https://github.com/erenosma2626-dot/rnd-research-atlas"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline text-black/70 dark:text-white/70"
        >
          GitHub: github.com/erenosma2626-dot/rnd-research-atlas
        </a>
      </footer>
    </div>
  );
};
