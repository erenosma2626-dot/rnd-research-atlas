import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { ProcessingStatusBadge } from '../ProcessingStatusBadge';

export interface DocumentBoxNodeData {
  title: string;
  status: string;
  documentId?: string;
  itemId: string;
  onOpenReport?: (documentId: string) => void;
  onDeleteItem?: (itemId: string) => void;
}

export const DocumentBoxNode: React.FC<NodeProps<DocumentBoxNodeData>> = ({ data, selected }) => {
  const isProcessing = data.status === 'processing' || data.status === 'pending';

  return (
    <div
      className={`relative w-64 p-4 rounded-2xl bg-card-bg-light dark:bg-card-bg-dark border transition-all duration-200 shadow-card hover:shadow-card-hover ${
        selected
          ? 'border-accent ring-2 ring-accent/20'
          : 'border-card-border-light dark:border-card-border-dark hover:border-accent/40'
      }`}
    >
      {/* React Flow Handles for future connections (Step 15) */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-2.5 h-2.5 !bg-accent border-2 border-white dark:border-gray-900 rounded-full"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-2.5 h-2.5 !bg-accent border-2 border-white dark:border-gray-900 rounded-full"
      />

      {/* Progress Bar if processing */}
      {isProcessing && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-blue-100 dark:bg-blue-950 overflow-hidden rounded-t-2xl">
          <div className="w-full h-full bg-accent animate-pulse origin-left" />
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-accent flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.75}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>

        <ProcessingStatusBadge status={data.status || 'done'} />
      </div>

      {/* Title */}
      <div className="mb-3">
        <h4 className="text-sm font-semibold text-text-primary-light dark:text-text-primary-dark line-clamp-2 leading-snug">
          {data.title || 'İsimsiz Doküman'}
        </h4>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-card-border-light/60 dark:border-card-border-dark/60">
        {data.documentId && data.onOpenReport ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              data.onOpenReport?.(data.documentId!);
            }}
            className="text-xs font-medium text-accent hover:underline flex items-center gap-1"
          >
            Raporu Aç →
          </button>
        ) : (
          <span className="text-[11px] text-text-secondary-light dark:text-text-secondary-dark">Doküman</span>
        )}

        {data.onDeleteItem && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              data.onDeleteItem?.(data.itemId);
            }}
            className="text-text-secondary-light hover:text-rose-600 p-1 rounded transition-colors"
            title="Canvas'tan Kaldır"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};
