import React, { useState } from 'react';
import { Check, X, Tag, Cpu, FlaskConical, Link2, Palette } from 'lucide-react';

export type EdgeColor = 'neutral' | 'indigo' | 'emerald' | 'amber' | 'rose';

interface EdgeRelationshipPopoverProps {
  position: { x: number; y: number };
  currentLabel: string;
  currentColor?: EdgeColor;
  onSave: (label: string | null, color: EdgeColor) => void;
  onClose: () => void;
}

const CATEGORIES = [
  {
    name: 'Mimari & ML',
    icon: Cpu,
    items: ['İçerir (Includes)', 'Genişletir (Extends)', 'Girdi Sağlar (Feeds)', 'Pipeline'],
  },
  {
    name: 'Bilimsel & Analitik',
    icon: FlaskConical,
    items: ['Kıyaslar (Benchmarks)', 'Geliştirir (SOTA)', 'Türetir (Derives)', 'Çürütür (Contradicts)'],
  },
  {
    name: 'Genel & Mantıksal',
    icon: Link2,
    items: ['İlgili (Related)', 'Referans (References)', 'Önkoşul (Depends on)'],
  },
];

export const EDGE_COLOR_OPTIONS: { id: EdgeColor; label: string; bgClass: string; hex: string }[] = [
  { id: 'neutral', label: 'Gri / Nötr', bgClass: 'bg-zinc-400 dark:bg-zinc-500', hex: '#71717A' },
  { id: 'indigo', label: 'İndigo', bgClass: 'bg-indigo-500', hex: '#6366F1' },
  { id: 'emerald', label: 'Zümrüt', bgClass: 'bg-emerald-500', hex: '#10B981' },
  { id: 'amber', label: 'Kehribar', bgClass: 'bg-amber-500', hex: '#F59E0B' },
  { id: 'rose', label: 'Gül', bgClass: 'bg-rose-500', hex: '#F43F5E' },
];

export const EdgeRelationshipPopover: React.FC<EdgeRelationshipPopoverProps> = ({
  position,
  currentLabel,
  currentColor = 'neutral',
  onSave,
  onClose,
}) => {
  const [selectedLabel, setSelectedLabel] = useState(currentLabel || '');
  const [selectedColor, setSelectedColor] = useState<EdgeColor>(currentColor);
  const [customText, setCustomText] = useState(currentLabel || '');

  const handleApply = (lbl: string | null, col: EdgeColor = selectedColor) => {
    onSave(lbl ? lbl.trim() : null, col);
  };

  const handleChipClick = (item: string) => {
    const newLbl = selectedLabel === item ? '' : item;
    setSelectedLabel(newLbl);
    setCustomText(newLbl);
    handleApply(newLbl, selectedColor);
  };

  const handleColorChange = (col: EdgeColor) => {
    setSelectedColor(col);
    handleApply(selectedLabel, col);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSelectedLabel(customText);
    handleApply(customText, selectedColor);
  };

  return (
    <div
      style={{ left: Math.max(16, position.x - 160), top: Math.max(70, position.y - 140) }}
      className="fixed z-50 w-84 p-4 rounded-3xl bg-white/95 dark:bg-[#161616]/95 backdrop-blur-md border border-black/[0.08] dark:border-white/[0.12] shadow-[0_20px_50px_rgba(0,0,0,0.18)] animate-in fade-in zoom-in-95 duration-150 select-none"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-black/[0.05] dark:border-white/[0.06]">
        <div className="flex items-center gap-1.5 text-xs font-mono text-black/70 dark:text-white/70">
          <Tag className="w-3.5 h-3.5" />
          <span>Bağlantı Ayarları</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-black/40 dark:text-white/40 hover:bg-black/[0.04] dark:hover:bg-white/[0.08]"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 1. İp Rengi Paleti */}
      <div className="mb-3.5 p-2 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06]">
        <div className="flex items-center justify-between mb-2 text-[10px] font-mono text-black/50 dark:text-white/50">
          <span className="flex items-center gap-1">
            <Palette className="w-3 h-3" />
            <span>Bağlantı Rengi</span>
          </span>
          <span className="capitalize">{EDGE_COLOR_OPTIONS.find((c) => c.id === selectedColor)?.label}</span>
        </div>
        <div className="flex items-center justify-between gap-1">
          {EDGE_COLOR_OPTIONS.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => handleColorChange(c.id)}
              className={`w-6 h-6 rounded-full transition-transform hover:scale-110 flex items-center justify-center ${
                c.bgClass
              } ${selectedColor === c.id ? 'ring-2 ring-black dark:ring-white scale-110 shadow-xs' : 'opacity-80 hover:opacity-100'}`}
              title={c.label}
            >
              {selectedColor === c.id && <Check className="w-3.5 h-3.5 text-white" />}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Categorized Chips */}
      <div className="space-y-3 mb-3 max-h-52 overflow-y-auto pr-1 scrollbar-thin">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          return (
            <div key={cat.name} className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-black/40 dark:text-white/40 uppercase tracking-wider">
                <Icon className="w-3 h-3" />
                <span>{cat.name}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {cat.items.map((item) => {
                  const isSelected = selectedLabel === item;
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => handleChipClick(item)}
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-mono transition-all ${
                        isSelected
                          ? 'bg-black text-white dark:bg-white dark:text-black font-semibold shadow-xs scale-[1.02]'
                          : 'bg-black/[0.03] dark:bg-white/[0.06] text-black/70 dark:text-white/70 hover:bg-black/[0.06] dark:hover:bg-white/[0.1]'
                      }`}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Custom Text Input */}
      <form onSubmit={handleCustomSubmit} className="pt-2 border-t border-black/[0.05] dark:border-white/[0.06] flex items-center gap-2">
        <input
          type="text"
          value={customText}
          onChange={(e) => setCustomText(e.target.value)}
          placeholder="Özel ilişki etiketi..."
          className="flex-1 px-3 py-1.5 rounded-xl text-xs font-mono bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/[0.1] outline-none focus:border-black/40 dark:focus:border-white/40 text-black dark:text-white"
        />
        <button
          type="submit"
          className="p-1.5 rounded-xl bg-black text-white dark:bg-white dark:text-black hover:opacity-90 transition-opacity"
          title="Kaydet"
        >
          <Check className="w-3.5 h-3.5" />
        </button>
        {selectedLabel && (
          <button
            type="button"
            onClick={() => {
              setSelectedLabel('');
              setCustomText('');
              handleApply(null, selectedColor);
            }}
            className="text-[10px] font-mono text-rose-500 hover:underline px-1"
          >
            Kaldır
          </button>
        )}
      </form>
    </div>
  );
};
