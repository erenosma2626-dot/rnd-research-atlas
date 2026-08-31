import React from 'react';
import { User } from 'lucide-react';
import { ProjectMemberInfo } from '../api/client';

interface MemberBadgeProps {
  member: ProjectMemberInfo;
  isCurrentUser?: boolean;
  onRemove?: () => void;
  canRemove?: boolean;
}

export const MemberBadge: React.FC<MemberBadgeProps> = ({
  member,
  isCurrentUser = false,
  onRemove,
  canRemove = false,
}) => {
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'owner':
        return (
          <span className="px-3 py-0.5 rounded-full text-[10px] font-semibold bg-black/[0.06] dark:bg-white/[0.1] text-[#0A0A0A] dark:text-white border border-black/[0.08] dark:border-white/[0.12]">
            Sahip
          </span>
        );
      case 'editor':
        return (
          <span className="px-3 py-0.5 rounded-full text-[10px] font-semibold bg-black/[0.03] dark:bg-white/[0.05] text-black/70 dark:text-white/70 border border-black/[0.05] dark:border-white/[0.08]">
            Editör
          </span>
        );
      default:
        return (
          <span className="px-3 py-0.5 rounded-full text-[10px] font-semibold bg-black/[0.02] dark:bg-white/[0.03] text-black/50 dark:text-white/50 border border-black/[0.04] dark:border-white/[0.06]">
            İzleyici
          </span>
        );
    }
  };

  return (
    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-[#141414] border border-black/[0.06] dark:border-white/[0.08] shadow-xs">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-full bg-black/[0.04] dark:bg-white/[0.06] text-black/60 dark:text-white/60 flex items-center justify-center flex-shrink-0">
          <User className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-[#0A0A0A] dark:text-white truncate">
              {member.display_name || member.email.split('@')[0]}
            </span>
            {isCurrentUser && (
              <span className="text-[10px] text-black/40 dark:text-white/40 font-mono">(Siz)</span>
            )}
          </div>
          <p className="text-[11px] text-black/50 dark:text-white/50 truncate font-mono">
            {member.email}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {getRoleBadge(member.role)}
        {canRemove && onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="p-1 rounded-full text-black/30 dark:text-white/30 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 transition-colors"
            title="Üyeyi Çıkar"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};
