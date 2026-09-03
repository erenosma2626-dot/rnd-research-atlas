import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  NodeDragHandler,
  Connection,
  MarkerType,
  addEdge,
  ReactFlowProvider,
  useReactFlow,
  SelectionMode,
  ConnectionMode,
  ConnectionLineType,
} from 'reactflow';
import 'reactflow/dist/style.css';

import {
  addCanvasItem,
  CanvasItemData,
  CanvasSummary,
  createCanvas,
  DEFAULT_PROJECT_ID,
  deleteCanvas,
  deleteCanvasItem,
  DocumentSummary,
  listCanvasItems,
  listProjectCanvases,
  renameCanvas,
  updateCanvasItem,
} from '../api/client';
import { CanvasToolbar } from '../components/canvas/CanvasToolbar';
import { EdgeRelationshipPopover, EdgeColor } from '../components/canvas/EdgeRelationshipPopover';
import { DocumentBoxNode, DocumentBoxNodeData } from '../components/canvas/DocumentBoxNode';
import { DrawingNode } from '../components/canvas/DrawingNode';
import { InventoryPanel } from '../components/canvas/InventoryPanel';
import { NoteNode } from '../components/canvas/NoteNode';
import { SectionBoxNode, SectionBoxNodeData } from '../components/canvas/SectionBoxNode';
import { ShapeNode } from '../components/canvas/ShapeNode';
import { StickyNoteNode, StickyNoteNodeData } from '../components/canvas/StickyNoteNode';
import { TextNode } from '../components/canvas/TextNode';
import { ToolMode, ToolModeProvider, useToolMode } from '../components/canvas/ToolModeContext';
import { useCanvasDrawing } from '../hooks/canvas/useCanvasDrawing';
import { useCanvasShortcuts } from '../hooks/canvas/useCanvasShortcuts';
import { useTheme } from '../theme/ThemeContext';

interface CanvasPageProps {
  canvasId: string;
  projectId?: string;
  onNavigateHome: () => void;
  onSelectDocument: (documentId: string) => void;
}

const getEdgeColors = (isDark: boolean): Record<string, { stroke: string; labelBg: string }> => ({
  neutral: { stroke: isDark ? "#71717A" : "#A1A1AA", labelBg: isDark ? "#27272A" : "#F4F4F5" },
  indigo: { stroke: "#6366F1", labelBg: isDark ? "rgba(99,102,241,0.25)" : "rgba(99,102,241,0.12)" },
  emerald: { stroke: "#10B981", labelBg: isDark ? "rgba(16,185,129,0.25)" : "rgba(16,185,129,0.12)" },
  amber: { stroke: "#F59E0B", labelBg: isDark ? "rgba(245,158,11,0.25)" : "rgba(245,158,11,0.12)" },
  rose: { stroke: "#F43F5E", labelBg: isDark ? "rgba(244,63,94,0.25)" : "rgba(244,63,94,0.12)" },
});

const CanvasContent: React.FC<CanvasPageProps> = ({
  canvasId: initialCanvasId,
  projectId = DEFAULT_PROJECT_ID,
  onNavigateHome,
  onSelectDocument,
}) => {
  const { isDark } = useTheme();
  const { screenToFlowPosition, getNodes } = useReactFlow();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { toolMode, setToolMode, activeShapeType, activeColor } = useToolMode();

  const [canvases, setCanvases] = useState<CanvasSummary[]>([]);
  const [activeCanvasId, setActiveCanvasId] = useState<string>(initialCanvasId || '');
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [edgePopover, setEdgePopover] = useState<{ edge: Edge; position: { x: number; y: number } } | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<any>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<any>([]);
  const [loading, setLoading] = useState(true);

  // Spacebar temporary pan mode
  const previousModeRef = useRef<ToolMode>(toolMode);
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.code === 'Space' && !e.repeat && toolMode !== 'pan') {
        previousModeRef.current = toolMode;
        setToolMode('pan');
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' && previousModeRef.current) {
        setToolMode(previousModeRef.current);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [toolMode, setToolMode]);

  // Sync initialCanvasId from props
  useEffect(() => {
    if (initialCanvasId && initialCanvasId !== activeCanvasId) {
      setActiveCanvasId(initialCanvasId);
    }
  }, [initialCanvasId]);

  // 1. Proje Canvas'larını Listele
  const fetchCanvases = useCallback(async () => {
    try {
      const list = await listProjectCanvases(projectId);
      setCanvases(list);
      if (list.length > 0 && (!activeCanvasId || !list.some((c) => c.id === activeCanvasId))) {
        setActiveCanvasId(list[0].id);
      }
    } catch {
      // sessiz hata
    }
  }, [projectId, activeCanvasId]);

  useEffect(() => {
    fetchCanvases();
  }, [fetchCanvases]);

  const handleDeleteItem = useCallback(
    async (itemId: string) => {
      try {
        await deleteCanvasItem(itemId);
        setNodes((nds) => nds.filter((n) => n.id !== itemId));
        setEdges((eds) => eds.filter((e) => e.id !== itemId && e.source !== itemId && e.target !== itemId));
      } catch (err: any) {
        alert(err.message || 'Silinemedi');
      }
    },
    [setNodes, setEdges]
  );

  const handleUpdateNoteText = useCallback(
    async (itemId: string, text: string) => {
      try {
        await updateCanvasItem(itemId, { content: { text } });
      } catch {
        // sessiz hata
      }
    },
    []
  );

  const handleUpdateNoteColor = useCallback(
    async (itemId: string, color: string) => {
      try {
        await updateCanvasItem(itemId, { content: { color } });
      } catch {
        // sessiz hata
      }
    },
    []
  );

  const handleShapeResizeStop = useCallback(
    async (itemId: string, width: number, height: number, x: number, y: number) => {
      try {
        await updateCanvasItem(itemId, {
          position_x: Math.round(x),
          position_y: Math.round(y),
          content: {
            width: Math.round(width),
            height: Math.round(height),
          },
        });
      } catch {
        // sessiz hata
      }
    },
    []
  );

  const handleShapeColorChange = useCallback(
    async (itemId: string, color: string) => {
      try {
        await updateCanvasItem(itemId, { content: { color } });
        setNodes((nds) =>
          nds.map((n) =>
            n.id === itemId
              ? { ...n, data: { ...n.data, color } }
              : n
          )
        );
      } catch {
        // sessiz hata
      }
    },
    [setNodes]
  );

  const handleRenameDocumentTitle = useCallback(
    async (itemId: string, newTitle: string) => {
      try {
        await updateCanvasItem(itemId, { content: { title: newTitle } });
        setNodes((nds) =>
          nds.map((n) =>
            n.id === itemId
              ? { ...n, data: { ...n.data, title: newTitle } }
              : n
          )
        );
      } catch {
        // sessiz hata
      }
    },
    [setNodes]
  );

  const handleRenameSectionTitle = useCallback(
    async (itemId: string, newTitle: string) => {
      try {
        await updateCanvasItem(itemId, { content: { title: newTitle } });
        setNodes((nds) =>
          nds.map((n) =>
            n.id === itemId
              ? { ...n, data: { ...n.data, title: newTitle } }
              : n
          )
        );
      } catch {
        // sessiz hata
      }
    },
    [setNodes]
  );

  const handleToggleExpandSection = useCallback(
    async (itemId: string, isExpanded: boolean) => {
      try {
        await updateCanvasItem(itemId, { content: { is_expanded: isExpanded } });
        setNodes((nds) =>
          nds.map((n) =>
            n.id === itemId
              ? { ...n, data: { ...n.data, is_expanded: isExpanded } }
              : n
          )
        );
      } catch {
        // sessiz hata
      }
    },
    [setNodes]
  );

  const handleSectionResizeStop = useCallback(
    async (itemId: string, width: number, height: number, x: number, y: number) => {
      try {
        await updateCanvasItem(itemId, {
          position_x: Math.round(x),
          position_y: Math.round(y),
          content: {
            width: Math.round(width),
            height: Math.round(height),
          },
        });
        setNodes((nds) =>
          nds.map((n) =>
            n.id === itemId
              ? {
                  ...n,
                  style: { ...n.style, width, height },
                  data: { ...n.data, width, height },
                }
              : n
          )
        );
      } catch {
        // sessiz hata
      }
    },
    [setNodes]
  );

  // Custom Node Tipleri
  const nodeTypes = useMemo(
    () => ({
      document_box: DocumentBoxNode,
      section_box: SectionBoxNode,
      note: NoteNode,
      sticky_note: StickyNoteNode,
      drawing: DrawingNode,
      shape: ShapeNode,
      text: TextNode,
    }),
    []
  );

  // 2. Aktif Canvas Elemanlarını Çek
  const fetchItems = useCallback(async () => {
    if (!activeCanvasId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const items: CanvasItemData[] = await listCanvasItems(activeCanvasId);

      const flowNodes: Node<any>[] = [];
      const flowEdges: Edge[] = [];

      for (const item of items) {
        if (item.item_type === 'document_box') {
          flowNodes.push({
            id: item.id,
            type: 'document_box',
            position: { x: item.position_x, y: item.position_y },
            data: {
              title: item.document_title || item.content?.title || 'Doküman',
              status: item.document_status || 'done',
              documentId: item.ref_id || undefined,
              itemId: item.id,
              added_by: item.added_by,
              is_own: item.is_own ?? true,
              onOpenReport: onSelectDocument,
              onDeleteItem: handleDeleteItem,
              onRenameTitle: handleRenameDocumentTitle,
            },
          });
        } else if (item.item_type === 'section_box') {
          const w = item.content?.width;
          const h = item.content?.height;
          const sec = item.section_content;
          const title = sec?.title || item.content?.title || 'Bölüm';
          const contentType = (sec?.content_type || item.content?.content_type || 'prose') as any;
          const content = sec?.content || item.content?.content || item.content || {};
          const figures = sec?.figures || item.content?.figures || [];
          const keyFinding = sec?.key_finding || item.content?.key_finding || null;
          const diagram = sec?.diagram || item.content?.diagram || null;
          const order = sec?.order || item.content?.order || 1;

          flowNodes.push({
            id: item.id,
            type: 'section_box',
            position: { x: item.position_x, y: item.position_y },
            style: w && h ? { width: w, height: h } : undefined,
            data: {
              section_id: (sec?.id || item.ref_id || item.id) as string,
              itemId: item.id,
              document_id: item.content?.document_id,
              title,
              content_type: contentType,
              content,
              order,
              width: w,
              height: h,
              is_expanded: item.content?.is_expanded || false,
              figures,
              key_finding: keyFinding,
              diagram,
              onRemoveFromCanvas: () => handleDeleteItem(item.id),
              onResizeStop: handleSectionResizeStop,
              onToggleExpand: handleToggleExpandSection,
              onRenameTitle: handleRenameSectionTitle,
            },
          });
        } else if (item.item_type === 'sticky_note') {
          flowNodes.push({
            id: item.id,
            type: 'sticky_note',
            position: { x: item.position_x, y: item.position_y },
            data: {
              text: item.content?.text || '',
              color: item.content?.color || 'amber',
              parent_item_id: item.content?.parent_item_id,
              onTextChange: (newText: string) => handleUpdateNoteText(item.id, newText),
              onColorChange: (newColor: string) => handleUpdateNoteColor(item.id, newColor),
              onDelete: () => handleDeleteItem(item.id),
            },
          });
        } else if (item.item_type === 'text') {
          flowNodes.push({
            id: item.id,
            type: 'text',
            position: { x: item.position_x, y: item.position_y },
            data: {
              text: item.content?.text || '',
              itemId: item.id,
              onTextChange: (newText: string) => handleUpdateNoteText(item.id, newText),
              onDelete: () => handleDeleteItem(item.id),
            },
          });
        } else if (item.item_type === 'drawing') {
          flowNodes.push({
            id: item.id,
            type: 'drawing',
            position: { x: item.position_x, y: item.position_y },
            data: {
              path_data: item.content?.path_data || '',
              color: item.content?.color || (isDark ? '#FFFFFF' : '#0A0A0A'),
              stroke_width: item.content?.stroke_width || 2,
              width: item.content?.width || 200,
              height: item.content?.height || 200,
            },
          });
        } else if (item.item_type === 'shape') {
          const w = item.content?.width || 180;
          const h = item.content?.height || 110;
          flowNodes.push({
            id: item.id,
            type: 'shape',
            position: { x: item.position_x, y: item.position_y },
            style: { width: w, height: h },
            data: {
              shape_type: item.content?.shape_type || 'rectangle',
              color: item.content?.color || 'neutral',
              background: item.content?.background,
              width: w,
              height: h,
              itemId: item.id,
              onResizeStop: handleShapeResizeStop,
              onColorChange: handleShapeColorChange,
            },
          });
        } else if (item.item_type === 'note') {
          flowNodes.push({
            id: item.id,
            type: 'note',
            position: { x: item.position_x, y: item.position_y },
            data: {
              text: item.content?.text || '',
              itemId: item.id,
              onUpdateText: handleUpdateNoteText,
              onDeleteItem: handleDeleteItem,
            },
          });
        } else if (item.item_type === 'connection' && item.content) {
          const colorKey = item.content.color || 'neutral';
          const colors = getEdgeColors(isDark);
          const colorCfg = colors[colorKey] || colors.neutral;
          flowEdges.push({
            id: item.id,
            source: item.content.from_item_id,
            target: item.content.to_item_id,
            sourceHandle: item.content.source_handle || undefined,
            targetHandle: item.content.target_handle || undefined,
            label: item.content.label || undefined,
            data: { color: colorKey },
            type: 'smoothstep',
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: colorCfg.stroke,
            },
            style: {
              stroke: colorCfg.stroke,
              strokeWidth: 2,
            },
            labelStyle: {
              fill: isDark ? '#FFFFFF' : '#0A0A0A',
              fontWeight: 600,
              fontSize: 11,
              fontFamily: 'monospace',
            },
            labelBgStyle: {
              fill: colorCfg.labelBg,
              fillOpacity: 0.95,
            },
            labelBgPadding: [6, 4],
            labelBgBorderRadius: 6,
          });
        }
      }

      setNodes(flowNodes);
      setEdges(flowEdges);
    } catch {
      // Hata durumunda boş bırak
    } finally {
      setLoading(false);
    }
  }, [
    activeCanvasId,
    onSelectDocument,
    handleDeleteItem,
    handleUpdateNoteText,
    handleUpdateNoteColor,
    handleShapeResizeStop,
    handleShapeColorChange,
    handleRenameDocumentTitle,
    handleRenameSectionTitle,
    handleToggleExpandSection,
    handleSectionResizeStop,
    isDark,
    setNodes,
    setEdges,
  ]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Hook 1: Klavye Kısayolları (Copy / Paste)
  useCanvasShortcuts({
    activeCanvasId,
    getNodes,
    setNodes,
  });

  // Hook 2: Çizim ve Sürükle-Bırak Şekil Mantığı
  const {
    isDrawing,
    currentPathPoints,
    shapeDragStart,
    shapeDragCurrent,
    handleCanvasClick,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  } = useCanvasDrawing({
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
  });

  // Sürükleyip bırakma durduğunda koordinatları PostgreSQL'e kaydet
  const onNodeDragStop: NodeDragHandler = useCallback(
    async (_event, node) => {
      try {
        await updateCanvasItem(node.id, {
          position_x: Math.round(node.position.x),
          position_y: Math.round(node.position.y),
        });
      } catch {
        // Sessiz hata
      }
    },
    []
  );

  // İki node arasına serbest bağlantı çekildiğinde
  const onConnect = useCallback(
    async (params: Connection) => {
      if (!params.source || !params.target) return;

      try {
        const newItem = await addCanvasItem(
          activeCanvasId,
          'connection',
          0,
          0,
          null,
          {
            from_item_id: params.source,
            to_item_id: params.target,
            source_handle: params.sourceHandle,
            target_handle: params.targetHandle,
            label: null,
            color: 'neutral',
          }
        );

        const colors = getEdgeColors(isDark);
        const colorCfg = colors.neutral;

        const newEdge: Edge = {
          id: newItem.id,
          source: params.source,
          target: params.target,
          sourceHandle: params.sourceHandle,
          targetHandle: params.targetHandle,
          type: 'smoothstep',
          data: { color: 'neutral' },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: colorCfg.stroke,
          },
          style: {
            stroke: colorCfg.stroke,
            strokeWidth: 2,
          },
        };

        setEdges((eds) => addEdge(newEdge, eds));
      } catch (err: any) {
        alert(err.message || 'Bağlantı oluşturulamadı.');
      }
    },
    [activeCanvasId, isDark, setEdges]
  );

  // Bağlantı çizgisine çift tıklanınca kategori popover açma
  const onEdgeDoubleClick = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      event.preventDefault();
      event.stopPropagation();
      setEdgePopover({
        edge,
        position: { x: event.clientX, y: event.clientY },
      });
    },
    []
  );

  const handleSelectEdgeLabel = async (label: string | null, color: EdgeColor) => {
    if (!edgePopover) return;
    const edge = edgePopover.edge;
    setEdgePopover(null);

    const colors = getEdgeColors(isDark);
    const colorCfg = colors[color] || colors.neutral;

    try {
      await updateCanvasItem(edge.id, {
        content: {
          from_item_id: edge.source,
          to_item_id: edge.target,
          source_handle: edge.sourceHandle,
          target_handle: edge.targetHandle,
          label: label,
          color: color,
        },
      });

      setEdges((eds) =>
        eds.map((e) =>
          e.id === edge.id
            ? {
                ...e,
                label: label || undefined,
                data: { ...e.data, color },
                type: 'smoothstep',
                markerEnd: {
                  type: MarkerType.ArrowClosed,
                  color: colorCfg.stroke,
                },
                style: {
                  ...e.style,
                  stroke: colorCfg.stroke,
                  strokeWidth: 2,
                },
                labelStyle: {
                  fill: isDark ? '#FFFFFF' : '#0A0A0A',
                  fontWeight: 600,
                  fontSize: 11,
                  fontFamily: 'monospace',
                },
                labelBgStyle: {
                  fill: colorCfg.labelBg,
                  fillOpacity: 0.95,
                },
                labelBgPadding: [6, 4] as [number, number],
                labelBgBorderRadius: 6,
              }
            : e
        )
      );
    } catch (err: any) {
      alert(err.message || 'İlişki güncellenemedi.');
    }
  };

  // Toplu Düğüm ve Kenar Silme
  const onNodesDelete = useCallback(
    (deleted: Node[]) => {
      Promise.all(deleted.map((n) => deleteCanvasItem(n.id).catch(() => {})));
    },
    []
  );

  const onEdgesDelete = useCallback(
    (deleted: Edge[]) => {
      Promise.all(deleted.map((e) => deleteCanvasItem(e.id).catch(() => {})));
    },
    []
  );

  // Canvas Yönetim İşlemleri (Sekmeler)
  const handleCreateCanvas = async () => {
    const name = window.prompt('Yeni Canvas sayfasının adını girin:', 'Yeni Canvas');
    if (!name || !name.trim()) return;

    try {
      const newCanvas = await createCanvas(name.trim(), projectId);
      setCanvases((prev) => [...prev, newCanvas]);
      setActiveCanvasId(newCanvas.id);
    } catch (err: any) {
      alert(err.message || 'Canvas oluşturulamadı.');
    }
  };

  const handleRenameCanvas = async (cId: string, currentName: string) => {
    const newName = window.prompt('Canvas adını güncelleyin:', currentName);
    if (!newName || !newName.trim() || newName.trim() === currentName) return;

    try {
      const updated = await renameCanvas(cId, newName.trim());
      setCanvases((prev) => prev.map((c) => (c.id === cId ? updated : c)));
    } catch (err: any) {
      alert(err.message || 'Yeniden adlandırılamadı.');
    }
  };

  const handleDeleteCanvas = async (cId: string, name: string) => {
    if (!window.confirm(`"${name}" canvas sayfasını silmek istediğinize emin misiniz?`)) return;

    try {
      await deleteCanvas(cId);
      const remaining = canvases.filter((c) => c.id !== cId);
      setCanvases(remaining);
      if (remaining.length > 0) {
        setActiveCanvasId(remaining[0].id);
      }
    } catch (err: any) {
      alert(err.message || 'Canvas silinemedi.');
    }
  };

  // Kutucuk, Şekil, Metin ve Not Ekleme
  const handleAddDocumentToCanvas = async (doc: DocumentSummary) => {
    const posX = 150 + Math.random() * 80;
    const posY = 150 + Math.random() * 80;

    try {
      const newItem = await addCanvasItem(
        activeCanvasId,
        'document_box',
        posX,
        posY,
        doc.id,
        { title: doc.original_filename }
      );

      const newNode: Node<DocumentBoxNodeData> = {
        id: newItem.id,
        type: 'document_box',
        position: { x: newItem.position_x, y: newItem.position_y },
        data: {
          title: doc.original_filename,
          status: doc.processing_status,
          documentId: doc.id,
          itemId: newItem.id,
          onOpenReport: onSelectDocument,
          onDeleteItem: handleDeleteItem,
          onRenameTitle: handleRenameDocumentTitle,
        },
      };

      setNodes((nds) => [...nds, newNode]);
    } catch (err: any) {
      alert(err.message || 'Kutucuk eklenemedi.');
    }
  };

  const handleAddNoteToCanvas = async () => {
    const selectedNode = getNodes().find((n) => n.selected);
    const parentId = selectedNode ? selectedNode.id : undefined;

    const posX = selectedNode ? selectedNode.position.x + 300 : 200 + Math.random() * 60;
    const posY = selectedNode ? selectedNode.position.y : 200 + Math.random() * 60;

    try {
      const newItem = await addCanvasItem(
        activeCanvasId,
        'sticky_note',
        posX,
        posY,
        null,
        { text: '', parent_item_id: parentId, color: activeColor || 'amber' }
      );

      const newNode: Node<StickyNoteNodeData> = {
        id: newItem.id,
        type: 'sticky_note',
        position: { x: newItem.position_x, y: newItem.position_y },
        data: {
          text: '',
          color: activeColor || 'amber',
          parent_item_id: parentId,
          onTextChange: (newText: string) => handleUpdateNoteText(newItem.id, newText),
          onColorChange: (newColor: string) => handleUpdateNoteColor(newItem.id, newColor),
          onDelete: () => handleDeleteItem(newItem.id),
        },
      };

      setNodes((nds) => [...nds, newNode]);
    } catch (err: any) {
      alert(err.message || 'Not eklenemedi.');
    }
  };

  const handleAddSectionToCanvas = async (title: string, contentType: string, contentText: string) => {
    const posX = 180 + Math.random() * 60;
    const posY = 180 + Math.random() * 60;

    try {
      const content = contentType === 'list'
        ? { items: contentText.split('\n').filter(Boolean) }
        : { text: contentText };

      const newItem = await addCanvasItem(
        activeCanvasId,
        'section_box',
        posX,
        posY,
        null,
        { title, content_type: contentType, content, order: 1 }
      );

      const newNode: Node<SectionBoxNodeData> = {
        id: newItem.id,
        type: 'section_box',
        position: { x: newItem.position_x, y: newItem.position_y },
        data: {
          section_id: newItem.id,
          itemId: newItem.id,
          title,
          content_type: contentType,
          content,
          order: 1,
          is_expanded: false,
          onRemoveFromCanvas: () => handleDeleteItem(newItem.id),
          onResizeStop: handleSectionResizeStop,
          onToggleExpand: handleToggleExpandSection,
          onRenameTitle: handleRenameSectionTitle,
        },
      };

      setNodes((nds) => [...nds, newNode]);
    } catch (err: any) {
      alert(err.message || 'Bölüm eklenemedi.');
    }
  };

  // Sürükle-Bırak Olayları (Hem Envanter Dokümanı hem de SectionPicker Bölümü)
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  }, []);

  const onDrop = useCallback(
    async (event: React.DragEvent) => {
      event.preventDefault();

      const docDataRaw = event.dataTransfer.getData('application/rnd-document');
      const sectionDataRaw = event.dataTransfer.getData('application/rnd-section');

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      const posX = Math.round(position.x);
      const posY = Math.round(position.y);

      // 1. Sürüklenebilir Section Menüsünden Bırakma
      if (sectionDataRaw) {
        try {
          const sec = JSON.parse(sectionDataRaw);
          const newItem = await addCanvasItem(
            activeCanvasId,
            'section_box',
            posX,
            posY,
            sec.sectionId || sec.documentId,
            {
              section_id: sec.sectionId,
              title: sec.title,
              content_type: sec.contentType,
              content: sec.content,
              order: sec.order,
              document_id: sec.documentId,
              figures: sec.figures,
              key_finding: sec.key_finding,
              is_expanded: false,
            }
          );

          const newNode: Node<SectionBoxNodeData> = {
            id: newItem.id,
            type: 'section_box',
            position: { x: posX, y: posY },
            data: {
              section_id: sec.sectionId,
              itemId: newItem.id,
              document_id: sec.documentId,
              title: sec.title,
              content_type: sec.contentType,
              content: sec.content,
              order: sec.order,
              figures: sec.figures,
              key_finding: sec.key_finding,
              is_expanded: false,
              onRemoveFromCanvas: () => handleDeleteItem(newItem.id),
              onResizeStop: handleSectionResizeStop,
              onToggleExpand: handleToggleExpandSection,
              onRenameTitle: handleRenameSectionTitle,
            },
          };

          setNodes((nds) => [...nds, newNode]);
        } catch (err: any) {
          alert(err.message || 'Bölüm canvas üzerine bırakılamadı.');
        }
        return;
      }

      // 2. Envanterden Doküman Bırakma
      if (docDataRaw) {
        try {
          const doc = JSON.parse(docDataRaw);
          const newItem = await addCanvasItem(
            activeCanvasId,
            'document_box',
            posX,
            posY,
            doc.id,
            { title: doc.original_filename }
          );

          const newNode: Node<DocumentBoxNodeData> = {
            id: newItem.id,
            type: 'document_box',
            position: { x: posX, y: posY },
            data: {
              title: doc.original_filename,
              status: doc.processing_status,
              documentId: doc.id,
              itemId: newItem.id,
              onOpenReport: onSelectDocument,
              onDeleteItem: handleDeleteItem,
              onRenameTitle: handleRenameDocumentTitle,
            },
          };

          setNodes((nds) => [...nds, newNode]);
        } catch (err: any) {
          alert(err.message || 'Doküman canvas üzerine bırakılamadı.');
        }
      }
    },
    [
      activeCanvasId,
      screenToFlowPosition,
      onSelectDocument,
      handleDeleteItem,
      handleRenameDocumentTitle,
      handleRenameSectionTitle,
      handleToggleExpandSection,
      handleSectionResizeStop,
      setNodes,
    ]
  );

  return (
    <div
      ref={reactFlowWrapper}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onClick={handleCanvasClick}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className={`relative w-screen h-screen overflow-hidden bg-white dark:bg-[#0A0A0A] transition-colors duration-200 ${
        toolMode === 'pan'
          ? 'cursor-grab active:cursor-grabbing'
          : toolMode === 'select'
          ? 'cursor-default'
          : toolMode === 'pen' || toolMode === 'shape' || toolMode === 'text'
          ? 'cursor-crosshair'
          : toolMode === 'eraser'
          ? 'cursor-pointer'
          : ''
      }`}
    >
      {/* Üst Araç Çubuğu & Sekmeler */}
      <CanvasToolbar
        canvases={canvases}
        activeCanvasId={activeCanvasId}
        onSelectCanvas={setActiveCanvasId}
        onCreateCanvas={handleCreateCanvas}
        onRenameCanvas={handleRenameCanvas}
        onDeleteCanvas={handleDeleteCanvas}
        onNavigateHome={onNavigateHome}
        onAddDocumentToCanvas={handleAddDocumentToCanvas}
        onAddNoteToCanvas={handleAddNoteToCanvas}
        onAddSectionToCanvas={handleAddSectionToCanvas}
        onToggleInventory={() => setIsInventoryOpen((prev) => !prev)}
        isInventoryOpen={isInventoryOpen}
      />

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/40 dark:bg-[#0A0A0A]/40 backdrop-blur-xs pointer-events-none">
          <div className="text-xs font-mono text-black/50 dark:text-white/50 animate-pulse">
            Canvas yükleniyor...
          </div>
        </div>
      )}

      {/* React Flow Çalışma Alanı */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={onNodeDragStop}
        onConnect={onConnect}
        onEdgeDoubleClick={onEdgeDoubleClick}
        onNodesDelete={onNodesDelete}
        onEdgesDelete={onEdgesDelete}
        nodeTypes={nodeTypes}
        fitView
        // Pan & Select Ayrımı
        panOnDrag={toolMode === 'pan' ? [0, 1, 2] : [1, 2]}
        selectionOnDrag={toolMode === 'select'}
        selectionMode={SelectionMode.Partial}
        multiSelectionKeyCode="Shift"
        nodesDraggable={toolMode === 'select' || toolMode === 'pan'}
        elementsSelectable={toolMode === 'select' || toolMode === 'pan'}
        connectionMode={ConnectionMode.Loose}
        connectionLineType={ConnectionLineType.SmoothStep}
        proOptions={{ hideAttribution: true }}
        className="w-full h-full"
      >
        <Background
          variant={"dots" as any}
          gap={24}
          size={1.5}
          color={isDark ? '#262626' : '#E5E5E5'}
        />
        <Controls className="!bg-white dark:!bg-[#141414] !border-black/[0.08] dark:!border-white/[0.1] !shadow-sm !rounded-2xl overflow-hidden" />
        <MiniMap
          className="!bg-white/85 dark:!bg-[#141414]/85 backdrop-blur-md !border-black/[0.08] dark:!border-white/[0.1] !rounded-2xl overflow-hidden shadow-sm"
          nodeColor={() => (isDark ? '#383838' : '#D4D4D8')}
          nodeStrokeColor="transparent"
          maskColor={isDark ? 'rgba(10, 10, 10, 0.75)' : 'rgba(255, 255, 255, 0.75)'}
        />
      </ReactFlow>

      {/* Anlamsal İlişki Seçici Popover */}
      {edgePopover && (
        <EdgeRelationshipPopover
          position={edgePopover.position}
          currentLabel={(typeof edgePopover.edge.label === 'string' ? edgePopover.edge.label : '') || ''}
          currentColor={(edgePopover.edge.data?.color as EdgeColor) || 'neutral'}
          onSave={handleSelectEdgeLabel}
          onClose={() => setEdgePopover(null)}
        />
      )}

      {/* Şekil Sürükle-Bırak Canlı Önizleme Katmanı */}
      {shapeDragStart && shapeDragCurrent && (
        <div
          className="absolute pointer-events-none z-30 transition-none"
          style={{
            left: Math.min(shapeDragStart.screenX, shapeDragCurrent.screenX),
            top: Math.min(shapeDragStart.screenY, shapeDragCurrent.screenY),
            width: Math.max(2, Math.abs(shapeDragCurrent.screenX - shapeDragStart.screenX)),
            height: Math.max(2, Math.abs(shapeDragCurrent.screenY - shapeDragStart.screenY)),
          }}
        >
          {activeShapeType === 'rectangle' && (
            <div
              className="w-full h-full rounded-xl"
              style={{
                border: `2px dashed ${
                  activeColor === 'indigo'
                    ? '#6366F1'
                    : activeColor === 'emerald'
                    ? '#10B981'
                    : activeColor === 'amber'
                    ? '#F59E0B'
                    : activeColor === 'rose'
                    ? '#F43F5E'
                    : isDark
                    ? '#E4E4E7'
                    : '#71717A'
                }`,
                backgroundColor:
                  activeColor === 'indigo'
                    ? 'rgba(99, 102, 241, 0.15)'
                    : activeColor === 'emerald'
                    ? 'rgba(16, 185, 129, 0.15)'
                    : activeColor === 'amber'
                    ? 'rgba(245, 158, 11, 0.15)'
                    : activeColor === 'rose'
                    ? 'rgba(244, 63, 94, 0.15)'
                    : 'rgba(113, 113, 122, 0.12)',
              }}
            />
          )}
          {activeShapeType === 'circle' && (
            <div
              className="w-full h-full rounded-full"
              style={{
                border: `2px dashed ${
                  activeColor === 'indigo'
                    ? '#6366F1'
                    : activeColor === 'emerald'
                    ? '#10B981'
                    : activeColor === 'amber'
                    ? '#F59E0B'
                    : activeColor === 'rose'
                    ? '#F43F5E'
                    : isDark
                    ? '#E4E4E7'
                    : '#71717A'
                }`,
                backgroundColor:
                  activeColor === 'indigo'
                    ? 'rgba(99, 102, 241, 0.15)'
                    : activeColor === 'emerald'
                    ? 'rgba(16, 185, 129, 0.15)'
                    : activeColor === 'amber'
                    ? 'rgba(245, 158, 11, 0.15)'
                    : activeColor === 'rose'
                    ? 'rgba(244, 63, 94, 0.15)'
                    : 'rgba(113, 113, 122, 0.12)',
              }}
            />
          )}
          {activeShapeType === 'arrow' && (
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <line
                x1="5"
                y1="50"
                x2="85"
                y2="50"
                stroke={isDark ? '#E4E4E7' : '#71717A'}
                strokeWidth="3"
                strokeDasharray="4 4"
              />
              <polygon points="80,40 95,50 80,60" fill={isDark ? '#E4E4E7' : '#71717A'} />
            </svg>
          )}
          {activeShapeType === 'line' && (
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <line
                x1="5"
                y1="50"
                x2="95"
                y2="50"
                stroke={isDark ? '#E4E4E7' : '#71717A'}
                strokeWidth="3"
                strokeDasharray="4 4"
              />
            </svg>
          )}
        </div>
      )}

      {/* Aktif Serbest Çizim Canlı Katmanı */}
      {isDrawing && currentPathPoints.length > 1 && (
        <svg className="absolute inset-0 pointer-events-none z-30 w-full h-full">
          <path
            d={currentPathPoints
              .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
              .join(' ')}
            stroke={isDark ? '#FFFFFF' : '#0A0A0A'}
            strokeWidth={2}
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      )}

      {/* Envanter Çekmecesi */}
      <InventoryPanel
        isOpen={isInventoryOpen}
        onClose={() => setIsInventoryOpen(false)}
        activeCanvasId={activeCanvasId}
        projectId={projectId}
        onAddDocumentToCanvas={(doc) => {
          handleAddDocumentToCanvas({
            id: doc.id,
            original_filename: doc.original_filename,
            storage_path: '',
            uploaded_at: '',
            processing_status: doc.processing_status as any,
          });
        }}
      />
    </div>
  );
};

export const CanvasPage: React.FC<CanvasPageProps> = (props) => (
  <ReactFlowProvider>
    <ToolModeProvider>
      <CanvasContent {...props} />
    </ToolModeProvider>
  </ReactFlowProvider>
);

export default CanvasPage;
