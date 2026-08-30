import React, { memo } from 'react';
import { Handle, NodeProps, NodeResizer, Position } from 'reactflow';

export type ShapeType = 'rectangle' | 'circle' | 'arrow' | 'line' | 'text';

export interface ShapeNodeData {
  shape_type: ShapeType;
  color?: string;
  background?: string;
  text?: string;
  width?: number;
  height?: number;
  onTextChange?: (newText: string) => void;
}

export const ShapeNode: React.FC<NodeProps<ShapeNodeData>> = memo(({ data, selected }) => {
  const {
    shape_type = 'rectangle',
    background = 'transparent',
    text = '',
    onTextChange,
  } = data;

  return (
    <div className="relative w-full h-full min-w-[60px] min-h-[40px] group">
      <NodeResizer
        isVisible={selected}
        minWidth={50}
        minHeight={30}
        handleClassName="!w-2 !h-2 !bg-black dark:!bg-white !rounded-full !border-none"
        lineClassName="!border-black/30 dark:!border-white/30"
      />

      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-black dark:!bg-white opacity-0 group-hover:opacity-100 transition-opacity" />
      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-black dark:!bg-white opacity-0 group-hover:opacity-100 transition-opacity" />
      <Handle type="target" position={Position.Left} className="!w-2 !h-2 !bg-black dark:!bg-white opacity-0 group-hover:opacity-100 transition-opacity" />
      <Handle type="source" position={Position.Right} className="!w-2 !h-2 !bg-black dark:!bg-white opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* 1. Rectangle */}
      {shape_type === 'rectangle' && (
        <div
          className={`w-full h-full rounded-xl border-2 border-black/[0.2] dark:border-white/[0.3] flex items-center justify-center p-3 text-xs font-sans text-center select-none ${
            selected ? 'ring-2 ring-black/20 dark:ring-white/20' : ''
          }`}
          style={{ backgroundColor: background }}
        >
          {onTextChange ? (
            <textarea
              defaultValue={text}
              onBlur={(e) => onTextChange(e.target.value)}
              placeholder="Metin..."
              className="w-full h-full bg-transparent resize-none outline-none text-center text-xs font-sans"
            />
          ) : (
            <span className="truncate">{text || ''}</span>
          )}
        </div>
      )}

      {/* 2. Circle */}
      {shape_type === 'circle' && (
        <div
          className={`w-full h-full rounded-full border-2 border-black/[0.2] dark:border-white/[0.3] flex items-center justify-center p-3 text-xs font-sans text-center select-none ${
            selected ? 'ring-2 ring-black/20 dark:ring-white/20' : ''
          }`}
          style={{ backgroundColor: background }}
        >
          <span className="truncate px-2">{text || ''}</span>
        </div>
      )}

      {/* 3. Text Box */}
      {shape_type === 'text' && (
        <div className="w-full h-full p-2 text-xs font-sans">
          {onTextChange ? (
            <textarea
              defaultValue={text}
              onBlur={(e) => onTextChange(e.target.value)}
              placeholder="Notunuzu yazın..."
              className="w-full h-full bg-transparent resize-none outline-none text-xs font-sans text-[#0A0A0A] dark:text-white"
            />
          ) : (
            <div className="text-xs whitespace-pre-wrap">{text || 'Metin kutusu'}</div>
          )}
        </div>
      )}

      {/* 4. Arrow / Line */}
      {(shape_type === 'arrow' || shape_type === 'line') && (
        <svg className="w-full h-full overflow-visible">
          <defs>
            <marker
              id="arrowhead"
              markerWidth="8"
              markerHeight="6"
              refX="7"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 8 3, 0 6" fill="currentColor" />
            </marker>
          </defs>
          <line
            x1="5"
            y1="50%"
            x2="95%"
            y2="50%"
            stroke="currentColor"
            strokeWidth="2"
            markerEnd={shape_type === 'arrow' ? 'url(#arrowhead)' : undefined}
          />
        </svg>
      )}
    </div>
  );
});
