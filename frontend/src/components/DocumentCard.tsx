import React, { useState } from 'react';
import { BookOpen, Plus, Trash2, X } from 'lucide-react';
import { addDocumentTag, DocumentSummary, removeDocumentTag } from '../api/client';
import { ProcessingStatusBadge } from './ProcessingStatusBadge';

interface DocumentCardProps {
  document: DocumentSummary;
  onClick: (documentId: string) => void;
  onDelete?: (documentId: string, e: React.MouseEvent) => void;
  onTagsUpdated?: (documentId: string, tags: string[]) => void;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({
  document,
  onClick,
  onDelete,
  onTagsUpdated,
}) => {
  const isProcessing = document.processing_status === 'processing' || document.processing_status === 'pending';
  const [tags, setTags] = useState<string[]>(document.tags || []);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return new Intl.DateTimeFormat('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch {
      return isoString;
    }
  };

  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const clean = newTagInput.trim();
    if (!clean) {
      setIsAddingTag(false);
      return;
    }

    try {
      const updated = await addDocumentTag(document.id, clean);
      setTags(updated);
      onTagsUpdated?.(document.id, updated);
      setNewTagInput('');
      setIsAddingTag(false);
    } catch (err: any) {
      alert(err.message || 'Etiket eklenemedi.');
    }
  };

  const handleRemoveTag = async (tagName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const updated = await removeDocumentTag(document.id, tagName);
      setTags(updated);
      onTagsUpdated?.(document.id, updated);
    } catch (err: any) {
      alert(err.message || 'Etiket silinemedi.');
    }
  };

  return (
    <div
      onClick={() => onClick(document.id)}
      className="group relative flex flex-col justify-between p-6 rounded-2xl bg-white dark:bg-[#141414] border border-black/[0.06] dark:border-white/[0.08] hover:border-black/20 dark:hover:border-white/20 shadow-sm hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer overflow-hidden"
    >
      {/* Processing bar */}
      {isProcessing && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-black/5 dark:bg-white/5 overflow-hidden">
          <div className="w-full h-full bg-[#0A0A0A] dark:bg-white animate-pulse origin-left" />
        </div>
      )}

      {/* Top Header: Line Icon & Status Badge */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="w-10 h-10 rounded-2xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.04] dark:border-white/[0.06] text-[#0A0A0A] dark:text-white flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-200">
          <BookOpen className="w-4 h-4 text-black/70 dark:text-white/70" strokeWidth={1.5} />
        </div>

        <div className="transform group-hover:scale-105 transition-transform duration-200">
          <ProcessingStatusBadge status={document.processing_status} />
        </div>
      </div>

      {/* Title with Characterful Serif Typography */}
      <div className="flex-1 mb-4">
        <h3
          className="font-serif text-base font-medium text-[#0A0A0A] dark:text-white line-clamp-2 leading-snug tracking-tight transition-colors"
          title={document.original_filename}
        >
          {document.original_filename}
        </h3>
        {document.error_message && document.processing_status === 'failed' && (
          <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400 line-clamp-2 font-mono">
            {document.error_message}
          </p>
        )}
      </div>

      {/* Tags Row */}
      <div className="mb-4 flex flex-wrap items-center gap-1.5 min-h-[24px]">
        {tags.map((t) => (
          <span
            key={t}
            className="group/tag inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-neutral-100 dark:bg-neutral-800/80 text-neutral-800 dark:text-neutral-200 border border-black/[0.04] dark:border-white/[0.06]"
          >
            <span>{t}</span>
            <button
              type="button"
              onClick={(e) => handleRemoveTag(t, e)}
              className="opacity-0 group-hover/tag:opacity-100 hover:text-rose-500 transition-opacity"
              title="Etiketi Kaldır"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          </span>
        ))}

        {/* Add Tag Form / Button */}
        {isAddingTag ? (
          <form
            onSubmit={handleAddTag}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center"
          >
            <input
              type="text"
              autoFocus
              value={newTagInput}
              onChange={(e) => setNewTagInput(e.target.value)}
              onBlur={() => {
                if (!newTagInput.trim()) setIsAddingTag(false);
              }}
              placeholder="Etiket..."
              className="px-2 py-0.5 text-[11px] font-mono rounded-full bg-black/[0.04] dark:bg-white/[0.06] border border-black/20 dark:border-white/20 text-[#0A0A0A] dark:text-white outline-none w-20"
            />
          </form>
        ) : (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsAddingTag(true);
            }}
            className="opacity-0 group-hover:opacity-100 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-all"
            title="Etiket Ekle"
          >
            <Plus className="w-3 h-3" />
            <span>Etiket</span>
          </button>
        )}
      </div>

      {/* Footer: Date & Actions */}
      <div className="flex items-center justify-between text-xs text-black/40 dark:text-white/40 pt-3 border-t border-black/[0.04] dark:border-white/[0.06]">
        <span className="font-mono text-[11px]">{formatDate(document.uploaded_at)}</span>

        {onDelete && (
          <button
            type="button"
            onClick={(e) => onDelete(document.id, e)}
            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-black/40 dark:text-white/40 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all"
            title="Dokümanı Sil"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
