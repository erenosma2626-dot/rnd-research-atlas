import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { X, GripVertical, Check, GitGraph, Sparkles } from 'lucide-react';
import {
  ControlPanelState,
  FilledSection,
  finalizeReport,
  FinalizeReportWithDiagramsResponse,
  SectionCandidate,
} from '../api/client';

interface SortableItemProps {
  candidate: SectionCandidate;
  onToggleInclude: (id: string) => void;
  onToggleDiagram: (id: string) => void;
}

const SortableItem: React.FC<SortableItemProps> = ({
  candidate,
  onToggleInclude,
  onToggleDiagram,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: candidate.group_id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : candidate.included ? 1 : 0.5,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-3.5 rounded-xl border transition-all duration-apple flex items-center gap-3 ${
        candidate.included
          ? 'bg-surface-light dark:bg-surface-dark border-border-light dark:border-border-dark shadow-sm'
          : 'bg-bg-light/60 dark:bg-bg-dark/60 border-dashed border-border-light dark:border-border-dark'
      }`}
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark"
        aria-label="Sırala"
      >
        <GripVertical className="w-4 h-4" />
      </button>

      {/* Include Checkbox */}
      <button
        onClick={() => onToggleInclude(candidate.group_id)}
        className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
          candidate.included ? 'bg-accent text-white' : 'border border-border-light dark:border-border-dark text-transparent'
        }`}
        aria-label={candidate.included ? 'Çıkar' : 'Dahil et'}
      >
        <Check className="w-3.5 h-3.5" />
      </button>

      {/* Title & Preview */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-text-primary-light dark:text-text-primary-dark truncate">
            {candidate.title}
          </span>
          <span className="text-[10px] text-text-secondary-light dark:text-text-secondary-dark font-mono truncate">
            ({candidate.group_id})
          </span>
        </div>
        <p className="text-[11px] text-text-secondary-light dark:text-text-secondary-dark truncate mt-0.5">
          {candidate.content_preview}
        </p>
      </div>

      {/* Diagram Toggle (if eligible) */}
      {candidate.diagram_eligible && (
        <button
          onClick={() => onToggleDiagram(candidate.group_id)}
          disabled={!candidate.included}
          className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg border transition-all ${
            candidate.diagram_included && candidate.included
              ? 'bg-accent/10 border-accent text-accent font-medium'
              : 'border-border-light dark:border-border-dark text-text-secondary-light dark:text-text-secondary-dark opacity-60'
          }`}
          title="Diyagram Üret"
        >
          <GitGraph className="w-3 h-3" />
          <span>Diyagram</span>
        </button>
      )}
    </div>
  );
};

interface ControlPanelDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
  originalSections: FilledSection[];
  controlPanelState: ControlPanelState;
  onFinalizeSuccess: (response: FinalizeReportWithDiagramsResponse) => void;
}

export const ControlPanelDrawer: React.FC<ControlPanelDrawerProps> = ({
  isOpen,
  onClose,
  documentId,
  originalSections,
  controlPanelState,
  onFinalizeSuccess,
}) => {
  const [candidates, setCandidates] = useState<SectionCandidate[]>(controlPanelState.candidates);
  const [isFinalizing, setIsFinalizing] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setCandidates((items) => {
        const oldIndex = items.findIndex((item) => item.group_id === active.id);
        const newIndex = items.findIndex((item) => item.group_id === over.id);
        const reordered = arrayMove(items, oldIndex, newIndex);
        return reordered.map((item, idx) => ({ ...item, order: idx + 1 }));
      });
    }
  };

  const handleToggleInclude = (id: string) => {
    setCandidates((prev) =>
      prev.map((c) => (c.group_id === id ? { ...c, included: !c.included } : c))
    );
  };

  const handleToggleDiagram = (id: string) => {
    setCandidates((prev) =>
      prev.map((c) => (c.group_id === id ? { ...c, diagram_included: !c.diagram_included } : c))
    );
  };

  const handleFinalize = async () => {
    setIsFinalizing(true);
    try {
      const updatedState: ControlPanelState = {
        document_id: documentId,
        candidates: candidates,
      };

      const result = await finalizeReport(documentId, originalSections, updatedState);
      onFinalizeSuccess(result);
      onClose();
    } catch (err: any) {
      alert(`Finalize hatası: ${err?.message || 'Bilinmeyen hata'}`);
    } finally {
      setIsFinalizing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-sm transition-opacity duration-apple">
      <div className="w-full max-w-md h-full bg-surface-light dark:bg-surface-dark border-l border-border-light dark:border-border-dark shadow-subtle flex flex-col animate-in slide-in-from-right duration-apple">
        {/* Header */}
        <div className="p-5 border-b border-border-light dark:border-border-dark flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-accent" />
            <h2 className="text-base font-semibold text-text-primary-light dark:text-text-primary-dark">
              Rapor Kontrol Paneli
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-secondary-light dark:text-text-secondary-dark hover:bg-bg-light dark:hover:bg-bg-dark transition-colors"
            aria-label="Kapat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          <div className="text-xs text-text-secondary-light dark:text-text-secondary-dark mb-2">
            Bölümleri sürükleyerek sıralayın, rapor dışı bırakmak için işareti kaldırın veya diyagram taleplerini yönetin.
          </div>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={candidates.map((c) => c.group_id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2.5">
                {candidates.map((candidate) => (
                  <SortableItem
                    key={candidate.group_id}
                    candidate={candidate}
                    onToggleInclude={handleToggleInclude}
                    onToggleDiagram={handleToggleDiagram}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-border-light dark:border-border-dark bg-bg-light dark:bg-bg-dark flex items-center justify-between gap-3">
          <div className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
            {candidates.filter((c) => c.included).length} / {candidates.length} Bölüm Seçili
          </div>

          <button
            onClick={handleFinalize}
            disabled={isFinalizing || candidates.filter((c) => c.included).length === 0}
            className="px-5 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-semibold disabled:opacity-50 transition-all flex items-center gap-2 shadow-sm"
          >
            {isFinalizing ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Oluşturuluyor...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Raporu Güncelle</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
