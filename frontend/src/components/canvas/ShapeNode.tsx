import React, { memo } from 'react';
import { Handle, NodeProps, Position } from 'reactflow';
import { NodeResizer } from '@reactflow/node-resizer';
import '@reactflow/node-resizer/dist/style.css';
import { useTheme } from '../../theme/ThemeContext';
import { CanvasColor, ColorPickerPopover } from './ColorPickerPopover';

export type ShapeType = 'rectangle' | 'circle' | 'arrow' | 'line';

export interface ShapeNodeData {
  shape_type: ShapeType;
  color?: string; // 'neutral' | 'indigo' | 'emerald' | 'amber' | 'rose'
  background?: string;
  width?: number;
  height?: number;
  itemId?: string;
  onResizeStop?: (id: string, width: number, height: number, x: number, y: number) => void;
  onColorChange?: (id: string, newColor: string) => void;
}

const COLOR_MAP: Record<string, { stroke: string; fill: string }> = {
  neutral: { stroke: '#71717A', fill: 'rgba(113, 113, 122, 0.08)' },
  indigo: { stroke: '#6366F1', fill: 'rgba(99, 102, 241, 0.1)' },
  emerald: { stroke: '#10B981', fill: 'rgba(16, 185, 129, 0.1)' },
  amber: { stroke: '#F59E0B', fill: 'rgba(245, 158, 11, 0.1)' },
  rose: { stroke: '#F43F5E', fill: 'rgba(244, 63, 94, 0.1)' },
};

export const ShapeNode: React.FC<NodeProps<ShapeNodeData>> = memo(({ data, selected }) => {
  const { isDark } = useTheme();
  const { shape_type = 'rectangle', color = 'neutral' } = data;

  const activeColor = COLOR_MAP[color] || COLOR_MAP.neutral;
  const strokeColor = isDark && color === 'neutral' ? '#D4D4D8' : activeColor.stroke;
  const fillColor = activeColor.fill;

  return (
    <div className="relative group w-full h-full min-w-[30px] min-h-[30px]">
      <NodeResizer
        isVisible={selected}
        minWidth={30}
        minHeight={30}
        lineClassName="border-[#0A0A0A] dark:border-white"
        handleClassName="h-2.5 w-2.5 bg-white dark:bg-[#0A0A0A] border-2 border-[#0A0A0A] dark:border-white rounded-xs"
        onResizeEnd={(_e, params) => {
          if (data.itemId && data.onResizeStop) {
            data.onResizeStop(data.itemId, params.width, params.height, params.x, params.y);
          }
        }}
      />

      {/* Floating Color Picker on Selection */}
      {selected && data.onColorChange && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-50">
          <ColorPickerPopover
            activeColor={color}
            onSelectColor={(newColor: CanvasColor) => {
              if (data.itemId && data.onColorChange) {
                data.onColorChange(data.itemId, newColor);
              }
            }}
          />
        </div>
      )}

            {/* 4 Cardinal Multi-Directional Handles (Loose Mode) */}
      <Handle id="top" type="source" position={Position.Top} className="!w-3.5 !h-3.5 !-top-2 !bg-black dark:!bg-white !border-2 !border-white dark:!border-[#141414] !rounded-full transition-transform hover:scale-125 cursor-crosshair z-50 shadow-xs" />
      <Handle id="right" type="source" position={Position.Right} className="!w-3.5 !h-3.5 !-right-2 !bg-black dark:!bg-white !border-2 !border-white dark:!border-[#141414] !rounded-full transition-transform hover:scale-125 cursor-crosshair z-50 shadow-xs" />
      <Handle id="bottom" type="source" position={Position.Bottom} className="!w-3.5 !h-3.5 !-bottom-2 !bg-black dark:!bg-white !border-2 !border-white dark:!border-[#141414] !rounded-full transition-transform hover:scale-125 cursor-crosshair z-50 shadow-xs" />
      <Handle id="left" type="source" position={Position.Left} className="!w-3.5 !h-3.5 !-left-2 !bg-black dark:!bg-white !border-2 !border-white dark:!border-[#141414] !rounded-full transition-transform hover:scale-125 cursor-crosshair z-50 shadow-xs" />

      {/* Render SVG Geometry */}
      <div className="w-full h-full flex items-center justify-center pointer-events-auto">
        {shape_type === 'rectangle' && (
          <div
            className="w-full h-full rounded-xl transition-all"
            style={{
              border: `2px solid ${strokeColor}`,
              backgroundColor: fillColor,
            }}
          />
        )}

        {shape_type === 'circle' && (
          <div
            className="w-full h-full rounded-full transition-all"
            style={{
              border: `2px solid ${strokeColor}`,
              backgroundColor: fillColor,
            }}
          />
        )}

        {shape_type === 'arrow' && (
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <line x1="5" y1="50" x2="85" y2="50" stroke={strokeColor} strokeWidth="3" />
            <polygon points="80,40 95,50 80,60" fill={strokeColor} />
          </svg>
        )}

        {shape_type === 'line' && (
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <line x1="5" y1="50" x2="95" y2="50" stroke={strokeColor} strokeWidth="3" strokeDasharray="4 4" />
          </svg>
        )}
      </div>
    </div>
  );
});

ShapeNode.displayName = 'ShapeNode';
