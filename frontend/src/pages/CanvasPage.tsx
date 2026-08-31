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
  getDocumentReport,
  listCanvasItems,
  listProjectCanvases,
  renameCanvas,
  updateCanvasItem,
} from '../api/client';
import { CanvasToolbar } from '../components/canvas/CanvasToolbar';
import { DocumentBoxNode, DocumentBoxNodeData } from '../components/canvas/DocumentBoxNode';
import { DrawingNode, DrawingNodeData } from '../components/canvas/DrawingNode';
import { InventoryPanel } from '../components/canvas/InventoryPanel';
import { NoteNode } from '../components/canvas/NoteNode';
import { SectionBoxNode, SectionBoxNodeData } from '../components/canvas/SectionBoxNode';
import { ShapeNode, ShapeNodeData } from '../components/canvas/ShapeNode';
import { StickyNoteNode, StickyNoteNodeData } from '../components/canvas/StickyNoteNode';
import { TextNode, TextNodeData } from '../components/canvas/TextNode';
import { ToolModeProvider, useToolMode } from '../components/canvas/ToolModeContext';
import { useTheme } from '../theme/ThemeContext';

interface CanvasPageProps {
  canvasId: string;
  projectId?: string;
  onNavigateHome: () => void;
  onSelectDocument: (documentId: string) => void;
}

const CanvasContent: React.FC<CanvasPageProps> = ({
  canvasId: initialCanvasId,
  projectId = DEFAULT_PROJECT_ID,
  onNavigateHome,
  onSelectDocument,
}) => {
  const { isDark } = useTheme();
  const { screenToFlowPosition, getNodes } = useReactFlow();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { toolMode, activeShapeType, activeColor } = useToolMode();

  const [canvases, setCanvases] = useState<CanvasSummary[]>([]);
  const [activeCanvasId, setActiveCanvasId] = useState<string>(initialCanvasId || '');
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);

  // Pen Drawing State
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPathPoints, setCurrentPathPoints] = useState<Array<{ x: number; y: number }>>([]);
  const [copiedNodes, setCopiedNodes] = useState<Node<any>[]>([]);

  const [nodes, setNodes, onNodesChange] = useNodesState<any>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<any>([]);
  const [loading, setLoading] = useState(true);

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

  // Explode Mode: Dökümanın Section'larını Dairesel Olarak Tuvale Aç
  const handleExplodeSections = useCallback(
    async (documentId: string, docNodeId: string) => {
      try {
        const currentNodes = getNodes();
        const docNode = currentNodes.find((n) => n.id === docNodeId);
        const centerPos = docNode ? docNode.position : { x: 300, y: 300 };

        const reportData = await getDocumentReport(documentId);
        const sections = reportData.sections || [];

        if (sections.length === 0) {
          alert('Bu makale için henüz rapor bölümü üretilmemiş.');
          return;
        }

        const radius = 340;
        const total = sections.length;
        const newNodes: Node<SectionBoxNodeData>[] = [];

        for (let i = 0; i < total; i++) {
          const sec = sections[i];
          const angle = (2 * Math.PI * i) / total - Math.PI / 2;
          const posX = Math.round(centerPos.x + radius * Math.cos(angle));
          const posY = Math.round(centerPos.y + radius * Math.sin(angle));
          const secId = (sec as any).id || sec.group_id || `sec-${i}`;
          const cType = sec.content_type || (sec as any).section_type || 'prose';
          const secOrder = (sec as any).order || i + 1;

          const savedItem = await addCanvasItem(
            activeCanvasId,
            'section_box',
            posX,
            posY,
            documentId,
            {
              section_id: secId,
              title: sec.title,
              content_type: cType,
              content: sec.content,
              order: secOrder,
              document_id: documentId,
            }
          );

          newNodes.push({
            id: savedItem.id,
            type: 'section_box',
            position: { x: posX, y: posY },
            data: {
              section_id: secId,
              document_id: documentId,
              title: sec.title,
              content_type: cType,
              content: sec.content,
              order: secOrder,
              onRemoveFromCanvas: () => handleDeleteItem(savedItem.id),
            },
          });
        }

        // Döküman kutusunu açık moda güncelle
        setNodes((nds) => [
          ...nds.map((n) =>
            n.id === docNodeId
              ? { ...n, data: { ...n.data, is_exploded: true } }
              : n
          ),
          ...newNodes,
        ]);
      } catch (err: any) {
        alert(err.message || 'Bölümler açılamadı.');
      }
    },
    [activeCanvasId, handleDeleteItem, getNodes, setNodes]
  );

  // Collapse Mode: Dökümana ait Section kutularını tuvalden topla
  const handleCollapseSections = useCallback(
    async (documentId: string) => {
      try {
        const currentNodes = getNodes();
        const toRemove = currentNodes.filter(
          (n) => n.type === 'section_box' && n.data?.document_id === documentId
        );
        for (const item of toRemove) {
          await deleteCanvasItem(item.id).catch(() => {});
        }

        setNodes((nds) =>
          nds
            .filter((n) => !(n.type === 'section_box' && n.data?.document_id === documentId))
            .map((n) =>
              n.type === 'document_box' && n.data?.documentId === documentId
                ? { ...n, data: { ...n.data, is_exploded: false } }
                : n
            )
        );
      } catch (err: any) {
        alert(err.message || 'Bölümler toplanamadı.');
      }
    },
    [getNodes, setNodes]
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
              is_exploded: false,
              onOpenReport: onSelectDocument,
              onDeleteItem: handleDeleteItem,
              onExplodeSections: handleExplodeSections,
              onCollapseSections: handleCollapseSections,
            },
          });
        } else if (item.item_type === 'section_box') {
          flowNodes.push({
            id: item.id,
            type: 'section_box',
            position: { x: item.position_x, y: item.position_y },
            data: {
              section_id: item.ref_id || item.id,
              document_id: item.content?.document_id,
              title: item.content?.title || 'Bölüm',
              content_type: item.content?.content_type || 'prose',
              content: item.content?.content || {},
              order: item.content?.order || 1,
              onRemoveFromCanvas: () => handleDeleteItem(item.id),
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
          flowNodes.push({
            id: item.id,
            type: 'shape',
            position: { x: item.position_x, y: item.position_y },
            data: {
              shape_type: item.content?.shape_type || 'rectangle',
              color: item.content?.color || 'neutral',
              background: item.content?.background,
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
          flowEdges.push({
            id: item.id,
            source: item.content.from_item_id,
            target: item.content.to_item_id,
            label: item.content.label || undefined,
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: isDark ? '#FFFFFF' : '#0A0A0A',
            },
            style: {
              stroke: isDark ? '#52525B' : '#A1A1AA',
              strokeWidth: 2,
            },
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
    handleExplodeSections,
    handleCollapseSections,
    isDark,
    setNodes,
    setEdges,
  ]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

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

  // İki node arasına bağlantı çekildiğinde
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
            label: null,
          }
        );

        const newEdge: Edge = {
          id: newItem.id,
          source: params.source,
          target: params.target,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: isDark ? '#FFFFFF' : '#0A0A0A',
          },
          style: {
            stroke: isDark ? '#52525B' : '#A1A1AA',
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

  // Bağlantı çizgisine çift tıklanınca etiket düzenleme
  const onEdgeDoubleClick = useCallback(
    async (_event: React.MouseEvent, edge: Edge) => {
      const currentLabel = (typeof edge.label === 'string' ? edge.label : '') || '';
      const newLabel = window.prompt('Bağlantı etiketi girin (boş bırakılırsa kaldırılır):', currentLabel);

      if (newLabel === null) return;

      try {
        await updateCanvasItem(edge.id, {
          content: {
            from_item_id: edge.source,
            to_item_id: edge.target,
            label: newLabel.trim() ? newLabel.trim() : null,
          },
        });

        setEdges((eds) =>
          eds.map((e) =>
            e.id === edge.id
              ? { ...e, label: newLabel.trim() ? newLabel.trim() : undefined }
              : e
          )
        );
      } catch (err: any) {
        alert(err.message || 'Etiket güncellenemedi.');
      }
    },
    [setEdges]
  );

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

  // 3. Canvas Yönetim İşlemleri (Sekmeler)
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

  // 4. Kutucuk, Şekil, Metin ve Not Ekleme
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
          onExplodeSections: handleExplodeSections,
          onCollapseSections: handleCollapseSections,
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
          title,
          content_type: contentType,
          content,
          order: 1,
          onRemoveFromCanvas: () => handleDeleteItem(newItem.id),
        },
      };

      setNodes((nds) => [...nds, newNode]);
    } catch (err: any) {
      alert(err.message || 'Bölüm eklenemedi.');
    }
  };

  // 5. Tuval Tıklama ve Çizim Olayları (Tool Mode Handling)
  const handleCanvasClick = async (e: React.MouseEvent) => {
    // Şekil veya Metin modundaysa tıklanan tam koordinata eleman ekle
    if (toolMode === 'shape') {
      const pos = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      try {
        const newItem = await addCanvasItem(
          activeCanvasId,
          'shape',
          Math.round(pos.x),
          Math.round(pos.y),
          null,
          { shape_type: activeShapeType, color: activeColor || 'neutral', width: 140, height: 80 }
        );

        const newNode: Node<ShapeNodeData> = {
          id: newItem.id,
          type: 'shape',
          position: { x: pos.x, y: pos.y },
          data: {
            shape_type: activeShapeType,
            color: activeColor || 'neutral',
          },
        };

        setNodes((nds) => [...nds, newNode]);
      } catch (err: any) {
        console.warn('Şekil eklenemedi:', err);
      }
      // NOT: toolMode 'shape' olarak KALIR, kullanıcı başka araç seçene kadar peş peşe şekil ekleyebilir
    } else if (toolMode === 'text') {
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
      } catch (err: any) {
        console.warn('Metin kutusu eklenemedi:', err);
      }
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (toolMode === 'pen') {
      const pos = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      setIsDrawing(true);
      setCurrentPathPoints([{ x: pos.x, y: pos.y }]);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (toolMode === 'pen' && isDrawing) {
      const pos = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      setCurrentPathPoints((prev) => [...prev, { x: pos.x, y: pos.y }]);
    }
  };

  const handleMouseUp = async () => {
    if (toolMode !== 'pen' || !isDrawing || currentPathPoints.length < 2) {
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
  };

  // 6. Klavye Kısayolları (Ctrl+C / Ctrl+V Kopyala-Yapıştır, Delete Toplu Silme)
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const isCopy = (isMac ? e.metaKey : e.ctrlKey) && e.key.toLowerCase() === 'c';
      const isPaste = (isMac ? e.metaKey : e.ctrlKey) && e.key.toLowerCase() === 'v';

      if (isCopy) {
        const selected = getNodes().filter((n) => n.selected);
        if (selected.length > 0) {
          setCopiedNodes(selected);
        }
      }

      if (isPaste && copiedNodes.length > 0) {
        e.preventDefault();
        const createdNodes: Node<any>[] = [];

        for (const nodeToCopy of copiedNodes) {
          const newPosX = nodeToCopy.position.x + 30;
          const newPosY = nodeToCopy.position.y + 30;

          try {
            const newItem = await addCanvasItem(
              activeCanvasId,
              nodeToCopy.type || 'note',
              newPosX,
              newPosY,
              nodeToCopy.data?.documentId || nodeToCopy.data?.section_id || null,
              nodeToCopy.data
            );

            createdNodes.push({
              ...nodeToCopy,
              id: newItem.id,
              position: { x: newPosX, y: newPosY },
              selected: true,
            });
          } catch {
            // sessiz devam
          }
        }

        if (createdNodes.length > 0) {
          setNodes((nds) => [...nds.map((n) => ({ ...n, selected: false })), ...createdNodes]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [copiedNodes, activeCanvasId, getNodes, setNodes]);

  // 7. Envanterden Sürükle-Bırak (HTML5 Drag and Drop)
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  }, []);

  const onDrop = useCallback(
    async (event: React.DragEvent) => {
      event.preventDefault();

      const docDataRaw = event.dataTransfer.getData('application/rnd-document');
      if (!docDataRaw) return;

      try {
        const doc = JSON.parse(docDataRaw);
        const position = screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });

        const newItem = await addCanvasItem(
          activeCanvasId,
          'document_box',
          Math.round(position.x),
          Math.round(position.y),
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
            onExplodeSections: handleExplodeSections,
            onCollapseSections: handleCollapseSections,
          },
        };

        setNodes((nds) => [...nds, newNode]);
      } catch (err: any) {
        alert(err.message || 'Doküman canvas üzerine bırakılamadı.');
      }
    },
    [
      activeCanvasId,
      screenToFlowPosition,
      onSelectDocument,
      handleDeleteItem,
      handleExplodeSections,
      handleCollapseSections,
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
        toolMode === 'pen'
          ? 'cursor-crosshair'
          : toolMode === 'eraser'
          ? 'cursor-pointer'
          : toolMode === 'shape' || toolMode === 'text'
          ? 'cursor-crosshair'
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
        // Tool Mode Entegrasyonu
        selectionOnDrag={toolMode === 'select'}
        panOnDrag={toolMode === 'select' ? [1, 2] : false}
        selectionMode={SelectionMode.Partial}
        multiSelectionKeyCode="Shift"
        nodesDraggable={toolMode === 'select'}
        elementsSelectable={toolMode === 'select'}
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
          className="!bg-white/80 dark:!bg-[#141414]/80 !border-black/[0.08] dark:!border-white/[0.1] !rounded-2xl overflow-hidden shadow-sm"
          nodeColor={(n) =>
            n.type === 'note' || n.type === 'sticky_note'
              ? '#FBBF24'
              : n.type === 'section_box'
              ? '#6366F1'
              : isDark
              ? '#FFFFFF'
              : '#0A0A0A'
          }
          maskColor={isDark ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)'}
        />
      </ReactFlow>

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
