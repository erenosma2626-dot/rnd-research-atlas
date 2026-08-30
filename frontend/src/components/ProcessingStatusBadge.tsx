import React from 'react';

export type BadgeStatus = 'pending' | 'processing' | 'done' | 'failed' | string;

interface ProcessingStatusBadgeProps {
  status: BadgeStatus;
  className?: string;
}

export const ProcessingStatusBadge: React.FC<ProcessingStatusBadgeProps> = ({ status, className = '' }) => {
  switch (status) {
    case 'done':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Hazır
        </span>
      );

    case 'processing':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          İşleniyor
        </span>
      );

    case 'failed':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          Hata
        </span>
      );

    case 'pending':
    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700 ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500" />
          Beklemede
        </span>
      );
  }
};
