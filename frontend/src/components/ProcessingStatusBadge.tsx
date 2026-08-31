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
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20 font-mono ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
          Hazır
        </span>
      );

    case 'processing':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20 font-mono ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
          İşleniyor
        </span>
      );

    case 'failed':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-rose-500/10 text-rose-800 dark:text-rose-300 border border-rose-500/20 font-mono ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
          Hata
        </span>
      );

    case 'pending':
    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-black/[0.04] text-black/70 dark:bg-white/[0.06] dark:text-white/70 border border-black/[0.06] dark:border-white/[0.08] font-mono ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-black/40 dark:bg-white/40 shrink-0" />
          Beklemede
        </span>
      );
  }
};
