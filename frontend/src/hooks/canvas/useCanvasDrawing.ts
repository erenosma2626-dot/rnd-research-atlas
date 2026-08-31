import React, { useState } from 'react';
import { Node } from 'reactflow';
import { addCanvasItem } from '../../api/client';
import { DrawingNodeData } from '../../components/canvas/DrawingNode';
import { ShapeNodeData, ShapeType } from '../../components/canvas/ShapeNode';
import { TextNodeData } from '../../components/canvas/TextNode';
import { ToolMode } from '../../components/canvas/ToolModeContext';

interface UseCanvasDrawingProps {
  toolMode: ToolMode;
  setToolMode: (mode: ToolMode) => void;
  activeShapeType: ShapeType;
  activeColor: string;
  activeCanvasId: string;
  isDark: boolean;
  screenToFlowPosition: (pos: { x: number; y: number }) => { x: number; y: number };
  reactFlowWrapper: React.RefObject<HTMLDivElement | null>;
  setNodes: React.Dispatch<React.SetStateAction<Node<any>[]>>;
  handleUpdateNoteText: (itemId: string, text: string) => void;
  handleDeleteItem: (itemId: string) => void;
  handleShapeResizeStop: (itemId: string, width: number, height: number, posX: number, posY: number) => void;
}

export function useCanvasDrawing({
  toolMode,
  setToolMode,
  activeShapeType,
  activeColor,
  activeCanvasId,
  isDark,
  screenToFlowPosition,
  reactFlowWrapper,
  setNodes,
  handleUpdateNoteText,
  handleDeleteItem,
  handleShapeResizeStop,
}: UseCanvasDrawingProps) {
  // Pen Drawing State
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPathPoints, setCurrentPathPoints] = useState<Array<{ x: number; y: number }>>([]);

  // Drag-to-create Shape State
  const [shapeDragStart, setShapeDragStart] = useState<{ x: number; y: number; screenX: number; screenY: number } | null>(null);
  const [shapeDragCurrent, setShapeDragCurrent] = useState<{ x: number; y: number; screenX: number; screenY: number } | null>(null);

  // Click handler (for Text tool)
  const handleCanvasClick = async (e: React.MouseEvent) => {
    if (toolMode === 'text') {
      const pos = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      try {
        const newItem = await addCanvasItem(
          activeCanvasId,
          'text',
          Math.round(pos.x),
          Math.round(pos.y),
          null,
          { text: '' }
        );

        const newNode: Node<TextNodeData> = {
          id: newItem.id,
          type: 'text',
          position: { x: pos.x, y: pos.y },
          data: {
            text: '',
            itemId: newItem.id,
            onTextChange: (newText: string) => handleUpdateNoteText(newItem.id, newText),
            onDelete: () => handleDeleteItem(newItem.id),
          },
        };

        setNodes((nds) => [...nds, newNode]);
        setToolMode('select');
      } catch (err: any) {
        console.warn('Metin kutusu eklenemedi:', err);
      }
    }
  };

  // Mouse Down handler
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click

    if (toolMode === 'pen') {
      const pos = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      setIsDrawing(true);
      setCurrentPathPoints([{ x: pos.x, y: pos.y }]);
    } else if (toolMode === 'shape') {
      const rect = reactFlowWrapper.current?.getBoundingClientRect();
      const screenX = rect ? e.clientX - rect.left : e.clientX;
      const screenY = rect ? e.clientY - rect.top : e.clientY;
      const flowPos = screenToFlowPosition({ x: e.clientX, y: e.clientY });

      setShapeDragStart({ x: flowPos.x, y: flowPos.y, screenX, screenY });
      setShapeDragCurrent({ x: flowPos.x, y: flowPos.y, screenX, screenY });
    }
  };

  // Mouse Move handler
  const handleMouseMove = (e: React.MouseEvent) => {
    if (toolMode === 'pen' && isDrawing) {
      const pos = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      setCurrentPathPoints((prev) => [...prev, { x: pos.x, y: pos.y }]);
    } else if (toolMode === 'shape' && shapeDragStart) {
      const rect = reactFlowWrapper.current?.getBoundingClientRect();
      const screenX = rect ? e.clientX - rect.left : e.clientX;
      const screenY = rect ? e.clientY - rect.top : e.clientY;
      const flowPos = screenToFlowPosition({ x: e.clientX, y: e.clientY });

      setShapeDragCurrent({ x: flowPos.x, y: flowPos.y, screenX, screenY });
    }
  };

  // Mouse Up handler
  const handleMouseUp = async () => {
    if (toolMode === 'pen') {
      if (!isDrawing || currentPathPoints.length < 2) {
        setIsDrawing(false);
        setCurrentPathPoints([]);
        return;
      }

      setIsDrawing(false);

      const minX = Math.min(...currentPathPoints.map((p) => p.x));
      const minY = Math.min(...currentPathPoints.map((p) => p.y));
      const maxX = Math.max(...currentPathPoints.map((p) => p.x));
      const maxY = Math.max(...currentPathPoints.map((p) => p.y));
      const width = Math.max(20, maxX - minX);
      const height = Math.max(20, maxY - minY);

      const pathData = currentPathPoints
        .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${(p.x - minX).toFixed(1)} ${(p.y - minY).toFixed(1)}`)
        .join(' ');

      setCurrentPathPoints([]);

      try {
        const color = isDark ? '#FFFFFF' : '#0A0A0A';
        const newItem = await addCanvasItem(
          activeCanvasId,
          'drawing',
          minX,
          minY,
          null,
          { path_data: pathData, width, height, color, stroke_width: 2 }
        );

        const newNode: Node<DrawingNodeData> = {
          id: newItem.id,
          type: 'drawing',
          position: { x: minX, y: minY },
          data: {
            path_data: pathData,
            color,
            stroke_width: 2,
            width,
            height,
          },
        };

        setNodes((nds) => [...nds, newNode]);
      } catch (err: any) {
        console.warn('Çizim kaydedilemedi:', err);
      }
    } else if (toolMode === 'shape' && shapeDragStart) {
      const start = shapeDragStart;
      const current = shapeDragCurrent || start;
      setShapeDragStart(null);
      setShapeDragCurrent(null);

      const rawW = Math.abs(current.x - start.x);
      const rawH = Math.abs(current.y - start.y);

      // Single click fallback: 180x110, Drag: exact box
      const isClickOnly = rawW < 12 && rawH < 12;
      const width = isClickOnly ? 180 : Math.max(30, Math.round(rawW));
      const height = isClickOnly ? 110 : Math.max(30, Math.round(rawH));
      const x = Math.round(isClickOnly ? start.x : Math.min(start.x, current.x));
      const y = Math.round(isClickOnly ? start.y : Math.min(start.y, current.y));

      try {
        const newItem = await addCanvasItem(
          activeCanvasId,
          'shape',
          x,
          y,
          null,
          {
            shape_type: activeShapeType,
            color: activeColor || 'neutral',
            width,
            height,
          }
        );

        const newNode: Node<ShapeNodeData> = {
          id: newItem.id,
          type: 'shape',
          position: { x, y },
          style: { width, height },
          data: {
            shape_type: activeShapeType,
            color: activeColor || 'neutral',
            width,
            height,
            itemId: newItem.id,
            onResizeStop: handleShapeResizeStop,
          },
        };

        setNodes((nds) => [...nds, newNode]);
        setToolMode('select');
      } catch (err: any) {
        console.warn('Şekil eklenemedi:', err);
      }
    }
  };

  return {
    isDrawing,
    currentPathPoints,
    shapeDragStart,
    shapeDragCurrent,
    handleCanvasClick,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  };
}
