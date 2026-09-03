import React, { memo, useState, useEffect } from 'react';
import { Handle, NodeProps, Position } from 'reactflow';
import { Trash2 } from 'lucide-react';

export interface StickyNoteNodeData {
  text: string;
  color?: string; // 'neutral' | 'indigo' | 'emerald' | 'amber' | 'rose'
  parent_item_id?: string;
  onTextChange?: (newText: string) => void;
  onColorChange?: (newColor: string) => void;
  onDelete?: () => void;
}

const COLOR_PALETTE: Record<string, { bgLight: string; bgDark: string; borderLight: string; borderDark: string; text: string }> = {
  neutral: {
    bgLight: 'bg-zinc-100',
    bgDark: 'bg-zinc-900',
    borderLight: 'border-zinc-300',
    borderDark: 'border-zinc-800',
    text: 'text-zinc-800 dark:text-zinc-200',
  },
  indigo: {
    bgLight: 'bg-indigo-50/80',
    bgDark: 'bg-indigo-950/40',
    borderLight: 'border-indigo-200',
    borderDark: 'border-indigo-800/60',
    text: 'text-indigo-900 dark:text-indigo-200',
  },
  emerald: {
    bgLight: 'bg-emerald-50/80',
    bgDark: 'bg-emerald-950/40',
    borderLight: 'border-emerald-200',
    borderDark: 'border-emerald-800/60',
    text: 'text-emerald-900 dark:text-emerald-200',
  },
  amber: {
    bgLight: 'bg-amber-50/90',
    bgDark: 'bg-amber-950/40',
    borderLight: 'border-amber-200',
    borderDark: 'border-amber-800/60',
    text: 'text-amber-900 dark:text-amber-200',
  },
  rose: {
    bgLight: 'bg-rose-50/80',
    bgDark: 'bg-rose-950/40',
    borderLight: 'border-rose-200',
    borderDark: 'border-rose-800/60',
    text: 'text-rose-900 dark:text-rose-200',
  },
};

export const StickyNoteNode: React.FC<NodeProps<StickyNoteNodeData>> = memo(({ data, selected }) => {
  const {
    text: initialText = '',
    color = 'amber',
    parent_item_id,
    onTextChange,
    onColorChange,
    onDelete,
  } = data;

  const [text, setText] = useState(initialText);
  const [activeColor, setActiveColor] = useState(color);

  useEffect(() => {
    setText(initialText);
  }, [initialText]);

  useEffect(() => {
    setActiveColor(color);
  }, [color]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    onTextChange?.(e.target.value);
  };

  const handleSelectColor = (colKey: string) => {
    setActiveColor(colKey);
    onColorChange?.(colKey);
  };

  const themeStyle = COLOR_PALETTE[activeColor] || COLOR_PALETTE.amber;

  return (
    <div
      className={`relative group w-48 min-h-[110px] p-3 rounded-2xl border shadow-xs transition-all ${
        themeStyle.bgLight
      } ${themeStyle.bgDark} ${themeStyle.borderLight} ${themeStyle.borderDark} ${
        selected ? 'ring-2 ring-[#0A0A0A] dark:ring-white shadow-md' : ''
      }`}
    >
            {/* 4 Cardinal Multi-Directional Handles (Loose Mode) */}
      <Handle id="top" type="source" position={Position.Top} className="!w-3.5 !h-3.5 !-top-2 !bg-black dark:!bg-white !border-2 !border-white dark:!border-[#141414] !rounded-full transition-transform hover:scale-125 cursor-crosshair z-50 shadow-xs" />
      <Handle id="right" type="source" position={Position.Right} className="!w-3.5 !h-3.5 !-right-2 !bg-black dark:!bg-white !border-2 !border-white dark:!border-[#141414] !rounded-full transition-transform hover:scale-125 cursor-crosshair z-50 shadow-xs" />
      <Handle id="bottom" type="source" position={Position.Bottom} className="!w-3.5 !h-3.5 !-bottom-2 !bg-black dark:!bg-white !border-2 !border-white dark:!border-[#141414] !rounded-full transition-transform hover:scale-125 cursor-crosshair z-50 shadow-xs" />
      <Handle id="left" type="source" position={Position.Left} className="!w-3.5 !h-3.5 !-left-2 !bg-black dark:!bg-white !border-2 !border-white dark:!border-[#141414] !rounded-full transition-transform hover:scale-125 cursor-crosshair z-50 shadow-xs" />

      {/* Header & Color Picker */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono font-semibold tracking-wider uppercase opacity-50">
            {parent_item_id ? 'YAPIŞKAN NOT' : 'NOT'}
          </span>
        </div>

        {/* 5-Color Picker Dots */}
        <div className="flex items-center gap-1">
          {Object.keys(COLOR_PALETTE).map((k) => (
            <button
              key={k}
              onClick={() => handleSelectColor(k)}
              className={`w-2.5 h-2.5 rounded-full transition-transform ${
                k === 'neutral'
                  ? 'bg-zinc-400'
                  : k === 'indigo'
                  ? 'bg-indigo-400'
                  : k === 'emerald'
                  ? 'bg-emerald-400'
                  : k === 'amber'
                  ? 'bg-amber-400'
                  : 'bg-rose-400'
              } ${activeColor === k ? 'scale-125 ring-1 ring-black/30' : 'hover:scale-110 opacity-70'}`}
              title={k}
            />
          ))}

          {onDelete && (
            <button
              onClick={onDelete}
              className="ml-1 p-0.5 rounded-md hover:bg-black/10 dark:hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
              title="Notu Sil"
            >
              <Trash2 className="w-2.5 h-2.5 text-black/50 dark:text-white/50" />
            </button>
          )}
        </div>
      </div>

      <textarea
        rows={3}
        value={text}
        onChange={handleChange}
        placeholder="Bir not yazın..."
        className={`w-full bg-transparent text-xs font-sans outline-none resize-none border-none leading-relaxed placeholder:opacity-40 ${themeStyle.text}`}
      />
    </div>
  );
});

StickyNoteNode.displayName = 'StickyNoteNode';
