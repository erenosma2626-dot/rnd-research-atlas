import React, { memo, useState } from 'react';
import { Handle, NodeProps, Position } from 'reactflow';
import { StickyNote, Trash2 } from 'lucide-react';

export interface StickyNoteNodeData {
  text: string;
  color?: string;
  parent_item_id?: string;
  onTextChange?: (newText: string) => void;
  onDelete?: () => void;
}

export const StickyNoteNode: React.FC<NodeProps<StickyNoteNodeData>> = memo(({ data, selected }) => {
  const { text = '', color = '#FEF08A', parent_item_id, onTextChange, onDelete } = data;
  const [isEditing, setIsEditing] = useState(false);
  const [currentText, setCurrentText] = useState(text);

  const handleBlur = () => {
    setIsEditing(false);
    if (onTextChange && currentText !== text) {
      onTextChange(currentText);
    }
  };

  return (
    <div
      className={`w-52 p-3.5 rounded-2xl shadow-sm transition-all duration-200 text-black border ${
        selected ? 'ring-2 ring-black/30 shadow-md scale-102' : 'hover:shadow-md'
      }`}
      style={{
        backgroundColor: color,
        borderColor: 'rgba(0,0,0,0.08)',
      }}
    >
      <Handle type="target" position={Position.Left} className="!w-2 !h-2 !bg-black/60" />

      {/* Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-black/10 text-black/60 text-[11px] font-mono">
        <div className="flex items-center gap-1.5 font-medium">
          <StickyNote className="w-3.5 h-3.5" />
          <span>{parent_item_id ? 'İliştirilmiş Not' : 'Not'}</span>
        </div>
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1 rounded hover:bg-black/10 transition-colors"
            title="Notu Sil"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Note Body */}
      {isEditing ? (
        <textarea
          autoFocus
          value={currentText}
          onChange={(e) => setCurrentText(e.target.value)}
          onBlur={handleBlur}
          className="w-full h-24 bg-transparent resize-none outline-none text-xs text-black/90 font-sans leading-relaxed"
          placeholder="Notunuzu yazın..."
        />
      ) : (
        <div
          onClick={() => setIsEditing(true)}
          className="min-h-[60px] text-xs text-black/90 font-sans whitespace-pre-wrap leading-relaxed cursor-text"
        >
          {currentText || <span className="text-black/40 italic">Not yazmak için tıklayın...</span>}
        </div>
      )}

      <Handle type="source" position={Position.Right} className="!w-2 !h-2 !bg-black/60" />
    </div>
  );
});
