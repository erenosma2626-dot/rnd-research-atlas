import React, { useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { BookOpen, ChevronDown, Folder, Trash2, User } from 'lucide-react';
import { UserSummary } from '../../api/client';
import { ProcessingStatusBadge } from '../ProcessingStatusBadge';
import { SectionPickerMenu } from './SectionPickerMenu';

export interface DocumentBoxNodeData {
  title: string;
  status: string;
  documentId?: string;
  itemId: string;
  added_by?: UserSummary | null;
  is_own?: boolean;
  onOpenReport?: (documentId: string) => void;
  onDeleteItem?: (itemId: string) => void;
  onRenameTitle?: (itemId: string, newTitle: string) => void;
}

export const DocumentBoxNode: React.FC<NodeProps<DocumentBoxNodeData>> = ({ data, selected }) => {
  const isProcessing = data.status === 'processing' || data.status === 'pending';
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(data.title || 'İsimsiz Doküman');

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    const trimmed = titleValue.trim();
    if (trimmed && trimmed !== data.title) {
      data.onRenameTitle?.(data.itemId, trimmed);
    } else {
      setTitleValue(data.title || 'İsimsiz Doküman');
    }
  };

  return (
    <div
      className={`relative w-72 p-4 rounded-2xl bg-white dark:bg-[#141414] border transition-all duration-200 shadow-sm hover:shadow-md ${
        selected
          ? 'border-black dark:border-white ring-2 ring-black/10 dark:ring-white/20'
          : data.is_own === false
          ? 'border-black/20 dark:border-white/20'
          : 'border-black/[0.08] dark:border-white/[0.1] hover:border-black/20 dark:hover:border-white/20'
      }`}
    >
      {/* Sürüklenebilir Section Menü Popover'ı */}
      {isPickerOpen && data.documentId && (
        <SectionPickerMenu
          documentId={data.documentId}
          documentTitle={data.title}
          onClose={() => setIsPickerOpen(false)}
        />
      )}

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
            <BookOpen className="w-4 h-4 text-black/70 dark:text-white/70" strokeWidth={1.5} />
          </div>

          {data.is_own === false && data.added_by && (
            <span
              className="w-5 h-5 rounded-full bg-black/5 dark:bg-white/10 text-black/60 dark:text-white/60 flex items-center justify-center"
              title={`${data.added_by.display_name} tarafından eklendi`}
            >
              <User className="w-3 h-3" />
            </span>
          )}
        </div>

        <ProcessingStatusBadge status={data.status || 'done'} />
      </div>

      {/* Title with Double-Click Inline Rename */}
      <div className="mb-3">
        {isEditingTitle ? (
          <input
            type="text"
            value={titleValue}
            autoFocus
            onChange={(e) => setTitleValue(e.target.value)}
            onBlur={handleTitleSubmit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleTitleSubmit();
              if (e.key === 'Escape') {
                setTitleValue(data.title || 'İsimsiz Doküman');
                setIsEditingTitle(false);
              }
            }}
            className="w-full px-2 py-1 text-sm font-serif font-medium rounded-lg bg-black/[0.04] dark:bg-white/[0.06] border border-black/20 dark:border-white/20 text-[#0A0A0A] dark:text-white outline-none"
          />
        ) : (
          <h4
            onDoubleClick={(e) => {
              e.stopPropagation();
              setIsEditingTitle(true);
            }}
            className="font-serif text-sm font-medium text-[#0A0A0A] dark:text-white line-clamp-2 leading-snug cursor-text select-none"
            title="İsmi değiştirmek için çift tıklayın"
          >
            {data.title || 'İsimsiz Doküman'}
          </h4>
        )}
      </div>

      {/* Section Mode Action ("Bölümler" Açılır Menü Butonu) */}
      {data.documentId && (
        <div className="mb-3 nodrag">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsPickerOpen((prev) => !prev);
            }}
            className={`w-full py-1.5 px-3 rounded-full text-xs font-medium flex items-center justify-between transition-all font-sans ${
              isPickerOpen
                ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs'
                : 'bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] dark:hover:bg-white/[0.1] text-[#0A0A0A] dark:text-white'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Folder className="w-3.5 h-3.5" />
              <span>Bölümler</span>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isPickerOpen ? 'rotate-180' : ''}`} />
          </button>
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
