import React, { memo, useState, useRef, useEffect } from 'react';
import { Handle, NodeProps, Position } from 'reactflow';
import { Trash2 } from 'lucide-react';

export interface TextNodeData {
  text: string;
  itemId: string;
  onTextChange: (newText: string) => void;
  onDelete?: () => void;
}

export const TextNode: React.FC<NodeProps<TextNodeData>> = memo(({ data, selected }) => {
  const { text: initialText = '', onTextChange, onDelete } = data;
  const [text, setText] = useState(initialText);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setText(initialText);
  }, [initialText]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    onTextChange?.(e.target.value);
  };

  return (
    <div
      className={`relative group min-w-[120px] max-w-[320px] p-2 rounded-xl transition-all ${
        selected
          ? 'ring-1 ring-[#0A0A0A] dark:ring-white bg-black/[0.02] dark:bg-white/[0.04]'
          : 'hover:bg-black/[0.02] dark:hover:bg-white/[0.02]'
      }`}
    >
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-[#0A0A0A] dark:!bg-white opacity-0 group-hover:opacity-100 transition-opacity" />
      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-[#0A0A0A] dark:!bg-white opacity-0 group-hover:opacity-100 transition-opacity" />
      <Handle type="target" position={Position.Left} className="!w-2 !h-2 !bg-[#0A0A0A] dark:!bg-white opacity-0 group-hover:opacity-100 transition-opacity" />
      <Handle type="source" position={Position.Right} className="!w-2 !h-2 !bg-[#0A0A0A] dark:!bg-white opacity-0 group-hover:opacity-100 transition-opacity" />

      {selected && onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute -top-3 -right-3 p-1 rounded-full bg-rose-500 text-white shadow-xs hover:bg-rose-600 transition-colors"
          title="Sil"
        >
          <Trash2 className="w-2.5 h-2.5" />
        </button>
      )}

      <textarea
        ref={textareaRef}
        rows={1}
        value={text}
        onChange={handleChange}
        placeholder="Metin yazın..."
        className="w-full bg-transparent text-xs font-sans text-[#0A0A0A] dark:text-white outline-none resize-none border-none leading-relaxed"
        style={{
          height: 'auto',
          minHeight: '24px',
        }}
      />
    </div>
  );
});

TextNode.displayName = 'TextNode';
