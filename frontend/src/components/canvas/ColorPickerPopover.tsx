import React from 'react';

export type CanvasColor = 'neutral' | 'indigo' | 'emerald' | 'amber' | 'rose';

interface ColorPickerPopoverProps {
  activeColor: string;
  onSelectColor: (color: CanvasColor) => void;
  className?: string;
}

export const CANVAS_COLORS: { id: CanvasColor; label: string; dotClass: string }[] = [
  { id: 'neutral', label: 'Gri', dotClass: 'bg-zinc-400 dark:bg-zinc-500' },
  { id: 'indigo', label: 'İndigo', dotClass: 'bg-indigo-500' },
  { id: 'emerald', label: 'Zümrüt', dotClass: 'bg-emerald-500' },
  { id: 'amber', label: 'Kehribar', dotClass: 'bg-amber-500' },
  { id: 'rose', label: 'Gül', dotClass: 'bg-rose-500' },
];

export const ColorPickerPopover: React.FC<ColorPickerPopoverProps> = ({
  activeColor,
  onSelectColor,
  className = '',
}) => {
  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className={`flex items-center gap-1 p-1 bg-white/95 dark:bg-[#18181B]/95 backdrop-blur-md rounded-full border border-black/[0.08] dark:border-white/[0.12] shadow-md ${className}`}
    >
      {CANVAS_COLORS.map((c) => {
        const isSelected = activeColor === c.id;
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onSelectColor(c.id)}
            className={`w-4 h-4 rounded-full transition-transform hover:scale-125 flex items-center justify-center ${
              c.dotClass
            } ${isSelected ? 'ring-2 ring-black dark:ring-white scale-110' : 'opacity-80 hover:opacity-100'}`}
            title={c.label}
          />
        );
      })}
    </div>
  );
};
