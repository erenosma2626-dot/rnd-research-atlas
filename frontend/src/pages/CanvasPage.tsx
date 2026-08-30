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
import { DocumentBoxNode, DocumentBoxNodeData } from '../components/canvas/DocumentBoxNode';
import { InventoryPanel } from '../components/canvas/InventoryPanel';
import { NoteNode, NoteNodeData } from '../components/canvas/NoteNode';
import { useTheme } from '../theme/ThemeContext';

interface CanvasPageProps {
  canvasId: string;
  onNavigateHome: () => void;
  onSelectDocument: (documentId: string) => void;
}

const CanvasContent: React.FC<CanvasPageProps> = ({
  canvasId: initialCanvasId,
  onNavigateHome,
  onSelectDocument,
}) => {
  const { isDark } = useTheme();
  const { screenToFlowPosition } = useReactFlow();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  const [canvases, setCanvases] = useState<CanvasSummary[]>([]);
  const [activeCanvasId, setActiveCanvasId] = useState<string>(initialCanvasId);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);

  const [nodes, setNodes, onNodesChange] = useNodesState<DocumentBoxNodeData | NoteNodeData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<any>([]);
  const [loading, setLoading] = useState(true);

  // 1. Proje Canvas'larını Listele
  const fetchCanvases = useCallback(async () => {
    try {
      const list = await listProjectCanvases(DEFAULT_PROJECT_ID);
      setCanvases(list);
      if (list.length > 0 && !list.some((c) => c.id === activeCanvasId)) {
        setActiveCanvasId(list[0].id);
      }
    } catch {
      // sessiz hata
    }
  }, [activeCanvasId]);

  useEffect(() => {
    fetchCanvases();
  }, [fetchCanvases]);

  // Custom Node Tipleri
  const nodeTypes = useMemo(
    () => ({
      document_box: DocumentBoxNode,
      note: NoteNode,
    }),
    []
  );

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

  // 2. Aktif Canvas Elemanlarını Çek
  const fetchItems = useCallback(async () => {
    if (!activeCanvasId) return;

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
              onOpenReport: onSelectDocument,
              onDeleteItem: handleDeleteItem,
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
              color: isDark ? '#9ca3af' : '#6b7280',
            },
            style: {
              stroke: isDark ? '#4b5563' : '#9ca3af',
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
  }, [activeCanvasId, onSelectDocument, handleDeleteItem, handleUpdateNoteText, isDark, setNodes, setEdges]);

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
            color: isDark ? '#9ca3af' : '#6b7280',
          },
          style: {
            stroke: isDark ? '#4b5563' : '#9ca3af',
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

  // Node veya Edge silme
  const onNodesDelete = useCallback(
    (deleted: Node[]) => {
      for (const n of deleted) {
        deleteCanvasItem(n.id).catch(() => {});
      }
    },
    []
  );

  const onEdgesDelete = useCallback(
    (deleted: Edge[]) => {
      for (const e of deleted) {
        deleteCanvasItem(e.id).catch(() => {});
      }
    },
    []
  );

  // 3. Canvas Yönetim İşlemleri (Sekmeler)
  const handleCreateCanvas = async () => {
    const name = window.prompt('Yeni Canvas sayfasının adını girin:', 'Yeni Canvas');
    if (!name || !name.trim()) return;

    try {
      const newCanvas = await createCanvas(name.trim(), DEFAULT_PROJECT_ID);
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

  // 4. Kutucuk ve Not Ekleme
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
        },
      };

      setNodes((nds) => [...nds, newNode]);
    } catch (err: any) {
      alert(err.message || 'Kutucuk eklenemedi.');
    }
  };

  const handleAddNoteToCanvas = async () => {
    const posX = 200 + Math.random() * 60;
    const posY = 200 + Math.random() * 60;

    try {
      const newItem = await addCanvasItem(
        activeCanvasId,
        'note',
        posX,
        posY,
        null,
        { text: '' }
      );

      const newNode: Node<NoteNodeData> = {
        id: newItem.id,
        type: 'note',
        position: { x: newItem.position_x, y: newItem.position_y },
        data: {
          text: '',
          itemId: newItem.id,
          onUpdateText: handleUpdateNoteText,
          onDeleteItem: handleDeleteItem,
        },
      };

      setNodes((nds) => [...nds, newNode]);
    } catch (err: any) {
      alert(err.message || 'Not eklenemedi.');
    }
  };

  // 5. Envanterden Sürükle-Bırak (HTML5 Drag and Drop)
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
          },
        };

        setNodes((nds) => [...nds, newNode]);
      } catch (err: any) {
        alert(err.message || 'Doküman canvas üzerine bırakılamadı.');
      }
    },
    [activeCanvasId, screenToFlowPosition, onSelectDocument, handleDeleteItem, setNodes]
  );

  return (
    <div
      ref={reactFlowWrapper}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className="relative w-screen h-screen overflow-hidden bg-bg-light dark:bg-bg-dark transition-colors duration-200"
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
        onToggleInventory={() => setIsInventoryOpen((prev) => !prev)}
        isInventoryOpen={isInventoryOpen}
      />

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-bg-light/40 dark:bg-bg-dark/40 backdrop-blur-xs">
          <div className="text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark animate-pulse">
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
        className="w-full h-full"
      >
        <Background
          variant={"dots" as any}
          gap={20}
          size={1.5}
          color={isDark ? '#333336' : '#d1d5db'}
        />
        <Controls className="!bg-card-bg-light dark:!bg-card-bg-dark !border-card-border-light dark:!border-card-border-dark !shadow-sm !rounded-xl overflow-hidden" />
        <MiniMap
          className="!bg-card-bg-light/80 dark:!bg-card-bg-dark/80 !border-card-border-light dark:!border-card-border-dark !rounded-2xl overflow-hidden shadow-sm"
          nodeColor={(n) => (n.type === 'note' ? '#f59e0b' : isDark ? '#3b82f6' : '#0071E3')}
          maskColor={isDark ? 'rgba(0, 0, 0, 0.6)' : 'rgba(240, 240, 245, 0.6)'}
        />
      </ReactFlow>

      {/* Envanter Çekmecesi */}
      <InventoryPanel
        isOpen={isInventoryOpen}
        onClose={() => setIsInventoryOpen(false)}
        activeCanvasId={activeCanvasId}
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
    <CanvasContent {...props} />
  </ReactFlowProvider>
);
