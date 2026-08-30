import React from 'react';
import { CanvasSummary } from '../../api/client';

interface CanvasTabsProps {
  canvases: CanvasSummary[];
  activeCanvasId: string;
  onSelectCanvas: (canvasId: string) => void;
  onCreateCanvas: () => void;
  onRenameCanvas: (canvasId: string, currentName: string) => void;
  onDeleteCanvas: (canvasId: string, name: string) => void;
}

export const CanvasTabs: React.FC<CanvasTabsProps> = ({
  canvases,
  activeCanvasId,
  onSelectCanvas,
  onCreateCanvas,
  onRenameCanvas,
  onDeleteCanvas,
}) => {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto py-1 px-1 max-w-[320px] sm:max-w-md md:max-w-lg scrollbar-none">
      {canvases.map((c) => {
        const isActive = c.id === activeCanvasId;
        return (
          <div
            key={c.id}
            onClick={() => onSelectCanvas(c.id)}
            className={`group relative flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-all duration-150 select-none flex-shrink-0 ${
              isActive
                ? 'bg-card-bg-light dark:bg-card-bg-dark text-accent shadow-xs border border-card-border-light dark:border-card-border-dark'
                : 'text-text-secondary-light dark:text-text-secondary-dark hover:bg-card-bg-light/60 dark:hover:bg-card-bg-dark/60 hover:text-text-primary-light dark:hover:text-text-primary-dark border border-transparent'
            }`}
          >
            <span className="truncate max-w-[120px] sm:max-w-[150px]">{c.name}</span>

            {/* Quick Actions (Rename / Delete) */}
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRenameCanvas(c.id, c.name);
                }}
                className="p-0.5 rounded hover:bg-bg-light dark:hover:bg-bg-dark text-text-secondary-light hover:text-text-primary-light"
                title="Yeniden Adlandır"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
              </button>

              {canvases.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteCanvas(c.id, c.name);
                  }}
                  className="p-0.5 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 text-text-secondary-light hover:text-rose-600"
                  title="Canvas'ı Sil"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        );
      })}

      {/* "+ Yeni Canvas" Button */}
      <button
        onClick={onCreateCanvas}
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark hover:bg-card-bg-light dark:hover:bg-card-bg-dark hover:text-accent transition-colors flex-shrink-0"
        title="Yeni Canvas Sayfası Ekle"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        <span>Yeni</span>
      </button>
    </div>
  );
};
