import React, { useState } from 'react';
import {
  addExistingDocumentToProject,
  InventoryItem,
  listUserProjects,
  ProjectSummary,
} from '../../api/client';
import { ProcessingStatusBadge } from '../ProcessingStatusBadge';

interface InventoryItemCardProps {
  item: InventoryItem;
  activeCanvasId: string;
  onAddDirectly: (doc: InventoryItem) => void;
  currentProjectId?: string;
}

export const InventoryItemCard: React.FC<InventoryItemCardProps> = ({
  item,
  activeCanvasId,
  onAddDirectly,
  currentProjectId,
}) => {
  const isUsedInActiveCanvas = item.used_in_canvases.some(
    (c) => c.canvas_id === activeCanvasId
  );

  const [isProjectsModalOpen, setIsProjectsModalOpen] = useState(false);
  const [userProjects, setUserProjects] = useState<ProjectSummary[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [addingToProject, setAddingToProject] = useState<string | null>(null);
  const [copiedSuccess, setCopiedSuccess] = useState<string | null>(null);

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

  const handleOpenProjectPicker = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setLoadingProjects(true);
      setIsProjectsModalOpen(true);
      const list = await listUserProjects();
      setUserProjects(list.filter((p) => p.id !== currentProjectId));
    } catch {
      setUserProjects([]);
    } finally {
      setLoadingProjects(false);
    }
  };

  const handleLinkToProject = async (targetProjectId: string, targetProjectName: string) => {
    try {
      setAddingToProject(targetProjectId);
      await addExistingDocumentToProject(targetProjectId, item.id);
      setCopiedSuccess(`${targetProjectName} projesine eklendi!`);
      setTimeout(() => {
        setCopiedSuccess(null);
        setIsProjectsModalOpen(false);
      }, 1500);
    } catch (err: any) {
      alert(err.message || 'Doküman projeye eklenemedi.');
    } finally {
      setAddingToProject(null);
    }
  };

  const contributorInitial = item.added_by?.display_name
    ? item.added_by.display_name.charAt(0).toUpperCase()
    : item.added_by?.email?.charAt(0).toUpperCase() || 'U';

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className={`group relative flex flex-col p-3 rounded-2xl border transition-all duration-150 cursor-grab active:cursor-grabbing select-none ${
        isUsedInActiveCanvas
          ? 'bg-card-bg-light/40 dark:bg-card-bg-dark/40 border-card-border-light/60 dark:border-card-border-dark/60 opacity-80'
          : !item.is_own
          ? 'bg-card-bg-light dark:bg-card-bg-dark border-indigo-200/80 dark:border-indigo-900/60 hover:border-indigo-400 shadow-xs'
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

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-text-primary-light dark:text-text-primary-dark truncate" title={item.original_filename}>
                {item.original_filename}
              </span>

              {/* Katkı Rozeti: Sadece başkası eklemişse gösterilir */}
              {!item.is_own && item.added_by && (
                <span
                  className="w-4 h-4 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[9px] font-bold flex items-center justify-center flex-shrink-0 cursor-help border border-indigo-200 dark:border-indigo-800"
                  title={`${item.added_by.display_name} (${item.added_by.email}) tarafından eklendi`}
                >
                  {contributorInitial}
                </span>
              )}
            </div>
          </div>
        </div>

        <ProcessingStatusBadge status={item.processing_status} />
      </div>

      {/* Usage Info & Actions */}
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

        <div className="flex items-center gap-2">
          {/* Başka Projeye Ekle Butonu */}
          <button
            type="button"
            onClick={handleOpenProjectPicker}
            className="text-[10px] text-text-secondary-light hover:text-text-primary-light p-1 rounded hover:bg-bg-light dark:hover:bg-bg-dark"
            title="Başka projeye kopyalamadan ekle"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => onAddDirectly(item)}
            className="text-xs font-medium text-accent hover:underline flex items-center gap-0.5"
          >
            + Ekle
          </button>
        </div>
      </div>

      {/* Başka Projeye Ekle Modal */}
      {isProjectsModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={(e) => {
            e.stopPropagation();
            setIsProjectsModalOpen(false);
          }}
        >
          <div
            className="w-full max-w-sm bg-card-bg-light dark:bg-card-bg-dark rounded-3xl border border-card-border-light dark:border-card-border-dark p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold truncate">Projeye Ekle: {item.original_filename}</h3>
              <button
                onClick={() => setIsProjectsModalOpen(false)}
                className="p-1 text-text-secondary-light hover:bg-bg-light dark:hover:bg-bg-dark rounded-lg"
              >
                ✕
              </button>
            </div>

            {copiedSuccess ? (
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-xs text-emerald-600 font-semibold text-center">
                ✓ {copiedSuccess}
              </div>
            ) : loadingProjects ? (
              <div className="p-6 text-center text-xs text-text-secondary-light animate-pulse">
                Projeler yükleniyor...
              </div>
            ) : userProjects.length === 0 ? (
              <div className="p-4 text-center text-xs text-text-secondary-light">
                Ekleyebileceğiniz başka bir proje bulunamadı.
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {userProjects.map((p) => (
                  <button
                    key={p.id}
                    disabled={addingToProject === p.id}
                    onClick={() => handleLinkToProject(p.id, p.name)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl border border-card-border-light dark:border-card-border-dark hover:border-accent hover:bg-bg-light dark:hover:bg-bg-dark text-left transition-all text-xs"
                  >
                    <span className="font-semibold truncate">{p.name}</span>
                    <span className="text-[10px] text-accent font-medium ml-2 flex-shrink-0">
                      {addingToProject === p.id ? 'Ekleniyor...' : '+ Bağla'}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
