import React, { memo } from 'react';
import { NodeProps } from 'reactflow';

export interface DrawingNodeData {
  path_data: string;
  color?: string;
  stroke_width?: number;
  width?: number;
  height?: number;
}

export const DrawingNode: React.FC<NodeProps<DrawingNodeData>> = memo(({ data, selected }) => {
  const { path_data, color = '#0A0A0A', stroke_width = 2, width = 200, height = 200 } = data;

  return (
    <div
      className={`relative select-none pointer-events-auto ${
        selected ? 'ring-1 ring-black/30 dark:ring-white/40 rounded-lg' : ''
      }`}
      style={{ width, height }}
    >
      <svg
        width={width}
        height={height}
        className="overflow-visible"
        style={{ pointerEvents: 'none' }}
      >
        <path
          d={path_data}
          stroke={color}
          strokeWidth={stroke_width}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
});
