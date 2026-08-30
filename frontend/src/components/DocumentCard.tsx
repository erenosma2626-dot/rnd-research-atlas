import React from 'react';
import { DocumentSummary } from '../api/client';
import { ProcessingStatusBadge } from './ProcessingStatusBadge';

interface DocumentCardProps {
  document: DocumentSummary;
  onClick: (documentId: string) => void;
  onDelete?: (documentId: string, e: React.MouseEvent) => void;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({ document, onClick, onDelete }) => {
  const isProcessing = document.processing_status === 'processing' || document.processing_status === 'pending';

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return new Intl.DateTimeFormat('tr-TR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch {
      return isoString;
    }
  };

  return (
    <div
      onClick={() => onClick(document.id)}
      className="group relative flex flex-col justify-between p-6 rounded-2xl bg-white dark:bg-[#141414] border border-black/[0.06] dark:border-white/[0.08] hover:border-black/20 dark:hover:border-white/20 shadow-sm hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer overflow-hidden"
    >
      {/* Progress Bar if processing */}
      {isProcessing && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-black/5 dark:bg-white/5 overflow-hidden">
          <div className="w-full h-full bg-[#0A0A0A] dark:bg-white animate-pulse origin-left" />
        </div>
      )}

      {/* Header: Icon & Status Badge */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] text-[#0A0A0A] dark:text-white flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-200">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.75}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>

        <div className="transform group-hover:scale-105 transition-transform duration-200">
          <ProcessingStatusBadge status={document.processing_status} />
        </div>
      </div>

      {/* Title / Filename */}
      <div className="flex-1 mb-4">
        <h3
          className="text-sm font-semibold text-[#0A0A0A] dark:text-white line-clamp-2 tracking-tight transition-colors"
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

      {/* Footer: Date & Delete Action */}
      <div className="flex items-center justify-between text-xs text-black/50 dark:text-white/50 pt-3 border-t border-black/[0.04] dark:border-white/[0.06]">
        <span className="font-mono text-[11px]">{formatDate(document.uploaded_at)}</span>

        {onDelete && (
          <button
            type="button"
            onClick={(e) => onDelete(document.id, e)}
            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-black/40 dark:text-white/40 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all"
            title="Dokümanı Sil"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.75}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};
