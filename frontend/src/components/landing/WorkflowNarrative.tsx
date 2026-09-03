import React, { useState } from 'react';
import { BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import { Upload, CheckCircle2, Cpu, Check } from 'lucide-react';
import { InteractiveMiniCanvas } from './InteractiveMiniCanvas';

export const WorkflowNarrative: React.FC = () => {
  // Step 3 interactive toggles
  const [selectedSections, setSelectedSections] = useState<string[]>([
    'methodology',
    'formulas',
    'benchmarks',
  ]);

  const toggleSection = (id: string) => {
    setSelectedSections((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  return (
    <section className="max-w-5xl mx-auto px-6 py-24 border-t border-black/[0.05] dark:border-white/[0.08]">
      {/* Section Header */}
      <div className="text-center mb-20">
        <span className="text-[11px] font-mono text-black/40 dark:text-white/40 uppercase tracking-widest block mb-2">
          İş Akışı
        </span>
        <h2 className="font-serif text-3xl sm:text-5xl font-medium tracking-tight text-[#0A0A0A] dark:text-white">
          Nasıl çalışıyor
        </h2>
      </div>

      <div className="space-y-24">
        {/* =========================================================================
            ADIM 01: MAKALE YÜKLEME & HAM KATMANLAMA
           ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-5 space-y-3 text-left">
            <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-medium">
              Adım 01
            </span>
            <h3 className="font-serif text-2xl sm:text-3xl font-medium text-[#0A0A0A] dark:text-white tracking-tight">
              Makaleni yükle
            </h3>
            <p className="text-sm text-black/65 dark:text-white/65 leading-relaxed font-sans">
              Her şey bir PDF sürüklemesi veya arXiv bağlantısıyla başlar. Docling motoru makaleyi piksellerden kurtarıp metin, görsel ve formül katmanlarına ayrıştırır.
            </p>
          </div>

          <div className="lg:col-span-7">
            <div className="p-6 rounded-2xl bg-[#FAFAFA] dark:bg-[#121212] border border-black/[0.06] dark:border-white/[0.08] shadow-xs">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-black/[0.05] dark:border-white/[0.06] text-xs font-mono">
                <div className="flex items-center gap-2 text-black/70 dark:text-white/70">
                  <Upload className="w-3.5 h-3.5" />
                  <span>arXiv:1706.03762.pdf</span>
                </div>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Ayrıştırıldı
                </span>
              </div>

              {/* Extracted Layers Pills */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-white dark:bg-[#181818] border border-black/[0.05] dark:border-white/[0.06] text-center">
                  <span className="block font-mono text-base font-bold text-black dark:text-white">12</span>
                  <span className="text-[10px] font-mono text-black/50 dark:text-white/50">Sayfa Metin</span>
                </div>
                <div className="p-3 rounded-xl bg-white dark:bg-[#181818] border border-black/[0.05] dark:border-white/[0.06] text-center">
                  <span className="block font-mono text-base font-bold text-black dark:text-white">14</span>
                  <span className="text-[10px] font-mono text-black/50 dark:text-white/50">LaTeX Denklemi</span>
                </div>
                <div className="p-3 rounded-xl bg-white dark:bg-[#181818] border border-black/[0.05] dark:border-white/[0.06] text-center">
                  <span className="block font-mono text-base font-bold text-black dark:text-white">8</span>
                  <span className="text-[10px] font-mono text-black/50 dark:text-white/50">Şekil & Tablo</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            ADIM 02: OTOMATİK ANALİZ & SEMANTİK AYRIŞTIRMA
           ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-5 lg:order-2 space-y-3 text-left">
            <span className="text-xs font-mono text-indigo-600 dark:text-indigo-400 font-medium">
              Adım 02
            </span>
            <h3 className="font-serif text-2xl sm:text-3xl font-medium text-[#0A0A0A] dark:text-white tracking-tight">
              Otomatik semantik analiz
            </h3>
            <p className="text-sm text-black/65 dark:text-white/65 leading-relaxed font-sans">
              Makale kendi anlatı akışına göre bölümlenir. Yöntem, deney ve ispat hiyerarşisi yakalanır; tüm gömülü denklemler matematiksel doğrulukla LaTeX koduna çevrilir.
            </p>
          </div>

          <div className="lg:col-span-7 lg:order-1">
            <div className="p-6 rounded-2xl bg-white dark:bg-[#121212] border border-black/[0.06] dark:border-white/[0.08] shadow-xs space-y-4">
              <div className="flex items-center justify-between text-xs font-mono text-black/50 dark:text-white/50">
                <span className="flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Bölüm 3.2 · Algılanan Çekirdek Formül</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-medium">
                  KaTeX LaTeX
                </span>
              </div>

              <div className="p-4 rounded-xl bg-[#FAFAFA] dark:bg-[#181818] text-center text-sm text-black dark:text-white overflow-x-auto">
                <BlockMath math="\text{Attention}(Q, K, V) = \text{softmax}\left(\frac{QK^T}{\sqrt{d_k}}\right)V" />
              </div>

              <div className="flex flex-wrap gap-2 pt-1 text-[10px] font-mono">
                <span className="px-2.5 py-1 rounded-md bg-black/[0.03] dark:bg-white/[0.05] text-black/70 dark:text-white/70">
                  § Teorem 1 (Matris İzdüşümü)
                </span>
                <span className="px-2.5 py-1 rounded-md bg-black/[0.03] dark:bg-white/[0.05] text-black/70 dark:text-white/70">
                  § Ölçekli Çarpım
                </span>
                <span className="px-2.5 py-1 rounded-md bg-black/[0.03] dark:bg-white/[0.05] text-black/70 dark:text-white/70">
                  § Softmax Dağılımı
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            ADIM 03: PLANLA VE ONAYLA (SENTEZ)
           ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-5 space-y-3 text-left">
            <span className="text-xs font-mono text-amber-600 dark:text-amber-400 font-medium">
              Adım 03
            </span>
            <h3 className="font-serif text-2xl sm:text-3xl font-medium text-[#0A0A0A] dark:text-white tracking-tight">
              Planla ve onayla
            </h3>
            <p className="text-sm text-black/65 dark:text-white/65 leading-relaxed font-sans">
              Hangi bulguların öne çıkacağına, tabloların ve mimari akışların sırasına siz karar verirsiniz. Gürültüyü eleyip sadece kritik ArGe çıkarımlarını rapora dahil edin.
            </p>
          </div>

          <div className="lg:col-span-7">
            <div className="p-6 rounded-2xl bg-[#FAFAFA] dark:bg-[#121212] border border-black/[0.06] dark:border-white/[0.08] shadow-xs space-y-3">
              <div className="text-xs font-mono text-black/40 dark:text-white/40 mb-2">
                Rapora Dahil Edilecek Bölümler (Tıklayarak Seçin):
              </div>

              {[
                { id: 'methodology', title: 'Metodoloji & Formül Notasyonu', badge: 'Kuramsal Temel' },
                { id: 'formulas', title: 'Yapay Sinir Ağı Mimarisi & Parametreler', badge: 'Model Şeması' },
                { id: 'benchmarks', title: 'WMT14 BLEU Kıyaslama Tablosu', badge: 'Deneysel Sonuç' },
                { id: 'ablation', title: 'Ablasyon Analizleri ve Varyasyonlar', badge: 'Opsiyonel' },
              ].map((item) => {
                const isSelected = selectedSections.includes(item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => toggleSection(item.id)}
                    className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all text-left ${
                      isSelected
                        ? 'bg-white dark:bg-[#181818] border-black/[0.15] dark:border-white/[0.2] shadow-xs'
                        : 'bg-transparent border-black/[0.04] dark:border-white/[0.05] opacity-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'bg-black text-white dark:bg-white dark:text-black'
                            : 'border border-black/20 dark:border-white/20'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </div>
                      <span className="text-xs font-medium text-black dark:text-white">
                        {item.title}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-black/40 dark:text-white/40">
                      {item.badge}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* =========================================================================
            ADIM 04: CANVAS'TA ORGANİZE ET (TAMAMEN SADE İNTERAKTİF TUVAL)
           ========================================================================= */}
        <div className="space-y-8 pt-4">
          <div className="max-w-2xl mx-auto text-center space-y-3">
            <span className="text-xs font-mono text-blue-600 dark:text-blue-400 font-medium">
              Adım 04
            </span>
            <h3 className="font-serif text-3xl sm:text-4xl font-medium text-[#0A0A0A] dark:text-white tracking-tight">
              Canvas'ta organize et
            </h3>
            <p className="text-sm text-black/65 dark:text-white/65 leading-relaxed font-sans">
              Bölümleri, formülleri ve deneyleri serbest bir düzleme yayın. Notlar ekleyin, düşüncelerinizi uzamsal olarak birbirine bağlayın.
            </p>
          </div>

          {/* Tamamen Sadeleşmiş, Başlıksız, Çerçevesiz İnteraktif Tuval */}
          <div className="py-2">
            <InteractiveMiniCanvas />
          </div>
        </div>
      </div>
    </section>
  );
};
