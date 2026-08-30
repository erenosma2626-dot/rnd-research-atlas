import React, { useState } from 'react';
import { CanvasSummary, DocumentSummary, listProjectDocuments } from '../../api/client';
import { useTheme } from '../../theme/ThemeContext';
import { CanvasTabs } from './CanvasTabs';

interface CanvasToolbarProps {
  canvases: CanvasSummary[];
  activeCanvasId: string;
  onSelectCanvas: (canvasId: string) => void;
  onCreateCanvas: () => void;
  onRenameCanvas: (canvasId: string, currentName: string) => void;
  onDeleteCanvas: (canvasId: string, name: string) => void;
  onNavigateHome: () => void;
  onAddDocumentToCanvas: (doc: DocumentSummary) => void;
  onAddNoteToCanvas: () => void;
  onToggleInventory: () => void;
  isInventoryOpen: boolean;
}

export const CanvasToolbar: React.FC<CanvasToolbarProps> = ({
  canvases,
  activeCanvasId,
  onSelectCanvas,
  onCreateCanvas,
  onRenameCanvas,
  onDeleteCanvas,
  onNavigateHome,
  onAddDocumentToCanvas,
  onAddNoteToCanvas,
  onToggleInventory,
  isInventoryOpen,
}) => {
  const { isDark, toggleTheme } = useTheme();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [availableDocs, setAvailableDocs] = useState<DocumentSummary[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  const handleOpenModal = async () => {
    setIsModalOpen(true);
    setLoadingDocs(true);
    try {
      const docs = await listProjectDocuments();
      setAvailableDocs(docs);
    } catch {
      setAvailableDocs([]);
    } finally {
      setLoadingDocs(false);
    }
  };

  const handleSelectDoc = (doc: DocumentSummary) => {
    onAddDocumentToCanvas(doc);
    setIsModalOpen(false);
  };

  return (
    <>
      <header className="absolute top-4 left-6 right-6 z-20 flex items-center justify-between pointer-events-none gap-3">
        {/* Left: Back Button & Canvas Tabs */}
        <div className="flex items-center gap-2 bg-bg-light/90 dark:bg-bg-dark/90 backdrop-blur-md p-1.5 rounded-2xl border border-card-border-light dark:border-card-border-dark shadow-sm pointer-events-auto overflow-hidden">
          <button
            onClick={onNavigateHome}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark hover:bg-card-bg-light dark:hover:bg-card-bg-dark hover:text-text-primary-light dark:hover:text-text-primary-dark transition-colors flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Projeye Dön
          </button>

          <div className="h-4 w-px bg-card-border-light dark:border-card-border-dark flex-shrink-0" />

          {/* Canvas Tabs */}
          <CanvasTabs
            canvases={canvases}
            activeCanvasId={activeCanvasId}
            onSelectCanvas={onSelectCanvas}
            onCreateCanvas={onCreateCanvas}
            onRenameCanvas={onRenameCanvas}
            onDeleteCanvas={onDeleteCanvas}
          />
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 bg-bg-light/90 dark:bg-bg-dark/90 backdrop-blur-md p-1.5 rounded-2xl border border-card-border-light dark:border-card-border-dark shadow-sm pointer-events-auto">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-text-secondary-light dark:text-text-secondary-dark hover:bg-card-bg-light dark:hover:bg-card-bg-dark transition-colors"
            title={isDark ? 'Açık Mod' : 'Koyu Mod'}
          >
            {isDark ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                />
              </svg>
            )}
          </button>

          {/* Not Ekle Button */}
          <button
            onClick={onAddNoteToCanvas}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-300 dark:border-amber-700/60 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 text-xs font-medium hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Not Ekle
          </button>

          {/* Kutucuk Ekle Button */}
          <button
            onClick={handleOpenModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-card-border-light dark:border-card-border-dark text-text-primary-light dark:text-text-primary-dark text-xs font-medium hover:bg-card-bg-light dark:hover:bg-card-bg-dark transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Kutucuk Ekle
          </button>

          {/* Envanter Drawer Button */}
          <button
            onClick={onToggleInventory}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl transition-all shadow-xs ${
              isInventoryOpen
                ? 'bg-accent text-white hover:bg-accent-hover'
                : 'bg-card-bg-light dark:bg-card-bg-dark text-text-primary-light dark:text-text-primary-dark border border-card-border-light dark:border-card-border-dark hover:border-accent/40'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Envanter
          </button>
        </div>
      </header>

      {/* Doküman Seçim Modalı */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-card-bg-light dark:bg-card-bg-dark rounded-3xl border border-card-border-light dark:border-card-border-dark p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold">Canvas'a Doküman Ekle</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-text-secondary-light hover:bg-bg-light dark:hover:bg-bg-dark"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {loadingDocs ? (
              <div className="p-8 text-center text-xs text-text-secondary-light">Dokümanlar aranıyor...</div>
            ) : availableDocs.length === 0 ? (
              <div className="p-8 text-center text-xs text-text-secondary-light">
                Projede henüz doküman bulunmuyor. Önce bir PDF yükleyin.
              </div>
            ) : (
              <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                {availableDocs.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => handleSelectDoc(doc)}
                    className="p-3 rounded-xl border border-card-border-light dark:border-card-border-dark hover:border-accent/60 bg-bg-light/50 dark:bg-bg-dark/50 cursor-pointer flex items-center justify-between gap-3 group transition-all"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <svg className="w-4 h-4 text-accent flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-xs font-medium truncate group-hover:text-accent transition-colors">
                        {doc.original_filename}
                      </span>
                    </div>

                    <span className="text-[10px] text-text-secondary-light flex-shrink-0">Ekle +</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
