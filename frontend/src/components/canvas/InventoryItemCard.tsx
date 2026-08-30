import React from 'react';
import { InventoryItem } from '../../api/client';
import { ProcessingStatusBadge } from '../ProcessingStatusBadge';

interface InventoryItemCardProps {
  item: InventoryItem;
  activeCanvasId: string;
  onAddDirectly: (doc: InventoryItem) => void;
}

export const InventoryItemCard: React.FC<InventoryItemCardProps> = ({
  item,
  activeCanvasId,
  onAddDirectly,
}) => {
  const isUsedInActiveCanvas = item.used_in_canvases.some(
    (c) => c.canvas_id === activeCanvasId
  );

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData(
      'application/rnd-document',
      JSON.stringify({
        id: item.id,
        original_filename: item.original_filename,
        processing_status: item.processing_status,
      })
    );
    e.dataTransfer.effectAllowed = 'copyMove';
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className={`group relative flex flex-col p-3 rounded-2xl border transition-all duration-150 cursor-grab active:cursor-grabbing select-none ${
        isUsedInActiveCanvas
          ? 'bg-card-bg-light/40 dark:bg-card-bg-dark/40 border-card-border-light/60 dark:border-card-border-dark/60 opacity-80'
          : 'bg-card-bg-light dark:bg-card-bg-dark border-card-border-light dark:border-card-border-dark hover:border-accent/50 shadow-xs hover:shadow-card'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-accent flex items-center justify-center flex-shrink-0">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.75}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <span className="text-xs font-semibold text-text-primary-light dark:text-text-primary-dark truncate" title={item.original_filename}>
            {item.original_filename}
          </span>
        </div>

        <ProcessingStatusBadge status={item.processing_status} />
      </div>

      {/* Usage Info & Action */}
      <div className="flex items-center justify-between text-[11px] pt-2 border-t border-card-border-light/40 dark:border-card-border-dark/40">
        <div>
          {isUsedInActiveCanvas ? (
            <span className="inline-flex items-center gap-1 text-[10px] text-accent font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              Canvas'ta ekli
            </span>
          ) : (
            <span className="text-text-secondary-light dark:text-text-secondary-dark text-[10px]">
              Sürükle veya ekle
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => onAddDirectly(item)}
          className="text-xs font-medium text-accent hover:underline flex items-center gap-0.5"
        >
          + Ekle
        </button>
      </div>
    </div>
  );
};
