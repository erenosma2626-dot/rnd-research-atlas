import React, { useEffect, useState } from 'react';
import { Handle, NodeProps, NodeResizer, Position } from 'reactflow';

export interface NoteNodeData {
  text: string;
  itemId: string;
  onUpdateText?: (itemId: string, text: string) => void;
  onDeleteItem?: (itemId: string) => void;
}

export const NoteNode: React.FC<NodeProps<NoteNodeData>> = ({ data, selected }) => {
  const [text, setText] = useState(data.text || '');

  useEffect(() => {
    setText(data.text || '');
  }, [data.text]);

  const handleBlur = () => {
    if (text !== data.text) {
      data.onUpdateText?.(data.itemId, text);
    }
  };

  return (
    <div
      className={`group relative flex flex-col w-full h-full min-w-[180px] min-h-[120px] p-3.5 rounded-2xl bg-amber-50/90 dark:bg-amber-950/40 border transition-all duration-200 shadow-card ${
        selected
          ? 'border-amber-400 ring-2 ring-amber-400/20'
          : 'border-amber-200/80 dark:border-amber-800/50 hover:border-amber-300'
      }`}
    >
      <NodeResizer
        minWidth={160}
        minHeight={100}
        isVisible={selected}
        lineClassName="!border-amber-400"
        handleClassName="!w-2 !h-2 !bg-amber-400 !border-white dark:!border-gray-900 rounded-sm"
      />

      {/* Connection Handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-2.5 h-2.5 !bg-amber-500 border-2 border-white dark:border-gray-900 rounded-full"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-2.5 h-2.5 !bg-amber-500 border-2 border-white dark:border-gray-900 rounded-full"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="w-2.5 h-2.5 !bg-amber-500 border-2 border-white dark:border-gray-900 rounded-full"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="w-2.5 h-2.5 !bg-amber-500 border-2 border-white dark:border-gray-900 rounded-full"
      />

      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-300 uppercase tracking-wider">
          Not
        </span>

        {data.onDeleteItem && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              data.onDeleteItem?.(data.itemId);
            }}
            className="text-amber-700/60 dark:text-amber-400/60 hover:text-rose-600 p-0.5 rounded transition-colors"
            title="Notu Sil"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Editable Area */}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={handleBlur}
        placeholder="Notunuzu buraya yazın..."
        className="flex-1 w-full bg-transparent resize-none border-none outline-none text-xs text-amber-950 dark:text-amber-100 placeholder-amber-700/40 dark:placeholder-amber-400/40 leading-relaxed font-sans"
      />
    </div>
  );
};
