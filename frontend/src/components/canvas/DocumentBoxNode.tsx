import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { FolderOpen, Layers, LayoutGrid, Trash2 } from 'lucide-react';
import { UserSummary } from '../../api/client';
import { ProcessingStatusBadge } from '../ProcessingStatusBadge';

export interface DocumentBoxNodeData {
  title: string;
  status: string;
  documentId?: string;
  itemId: string;
  added_by?: UserSummary | null;
  is_own?: boolean;
  is_exploded?: boolean;
  onOpenReport?: (documentId: string) => void;
  onDeleteItem?: (itemId: string) => void;
  onExplodeSections?: (documentId: string, nodeId: string) => void;
  onCollapseSections?: (documentId: string) => void;
}

export const DocumentBoxNode: React.FC<NodeProps<DocumentBoxNodeData>> = ({ id, data, selected }) => {
  const isProcessing = data.status === 'processing' || data.status === 'pending';

  const contributorInitial = data.added_by?.display_name
    ? data.added_by.display_name.charAt(0).toUpperCase()
    : data.added_by?.email?.charAt(0).toUpperCase() || 'U';

  return (
    <div
      className={`relative w-72 p-4 rounded-2xl bg-white dark:bg-[#141414] border transition-all duration-200 shadow-sm hover:shadow-md ${
        selected
          ? 'border-black dark:border-white ring-2 ring-black/10 dark:ring-white/20'
          : data.is_own === false
          ? 'border-indigo-200 dark:border-indigo-900/60'
          : 'border-black/[0.08] dark:border-white/[0.1] hover:border-black/20 dark:hover:border-white/20'
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2.5 !h-2.5 !bg-black dark:!bg-white"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2.5 !h-2.5 !bg-black dark:!bg-white"
      />

      {/* Processing Bar */}
      {isProcessing && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-black/10 dark:bg-white/10 overflow-hidden rounded-t-2xl">
          <div className="w-full h-full bg-[#0A0A0A] dark:bg-white animate-pulse" />
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] text-[#0A0A0A] dark:text-white flex items-center justify-center flex-shrink-0">
            <Layers className="w-4 h-4" />
          </div>

          {data.is_own === false && data.added_by && (
            <span
              className="w-5 h-5 rounded-full bg-black/10 dark:bg-white/10 text-[10px] font-bold flex items-center justify-center font-mono"
              title={`${data.added_by.display_name} tarafından eklendi`}
            >
              {contributorInitial}
            </span>
          )}
        </div>

        <ProcessingStatusBadge status={data.status || 'done'} />
      </div>

      {/* Title */}
      <div className="mb-3">
        <h4 className="font-serif text-sm font-medium text-[#0A0A0A] dark:text-white line-clamp-2 leading-snug">
          {data.title || 'İsimsiz Doküman'}
        </h4>
      </div>

      {/* Section Mode Actions (Klasör Modu <-> Açık Mod) */}
      {data.documentId && (
        <div className="mb-3 flex items-center gap-2">
          {data.is_exploded ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                data.onCollapseSections?.(data.documentId!);
              }}
              className="w-full py-1.5 px-2.5 rounded-full bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] dark:hover:bg-white/[0.1] text-xs font-medium text-[#0A0A0A] dark:text-white flex items-center justify-center gap-1.5 transition-colors font-sans"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Klasöre Topla</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                data.onExplodeSections?.(data.documentId!, id);
              }}
              className="w-full py-1.5 px-2.5 rounded-full bg-black text-white dark:bg-white dark:text-black hover:opacity-90 text-xs font-medium flex items-center justify-center gap-1.5 transition-all font-sans shadow-2xs"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>Bölümleri Aç (Explode)</span>
            </button>
          )}
        </div>
      )}

      {/* Footer Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-black/[0.04] dark:border-white/[0.06]">
        {data.documentId && data.onOpenReport ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              data.onOpenReport?.(data.documentId!);
            }}
            className="text-xs font-medium text-[#0A0A0A] dark:text-white hover:underline flex items-center gap-1"
          >
            Raporu Aç &rarr;
          </button>
        ) : (
          <span className="text-[11px] text-black/40 dark:text-white/40 font-mono">Doküman</span>
        )}

        {data.onDeleteItem && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              data.onDeleteItem?.(data.itemId);
            }}
            className="text-black/40 hover:text-rose-600 dark:text-white/40 dark:hover:text-rose-400 p-1 rounded transition-colors"
            title="Tuvalden Kaldır"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
