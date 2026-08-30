import React from 'react';
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
  const getInitials = (name: string, email: string) => {
    const text = name || email;
    return text.substring(0, 2).toUpperCase();
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'owner':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
            Sahip
          </span>
        );
      case 'editor':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-100 dark:bg-blue-950/60 text-accent dark:text-blue-300 border border-blue-200 dark:border-blue-800/60">
            Editör
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
            İzleyici
          </span>
        );
    }
  };

  return (
    <div className="flex items-center justify-between p-3 rounded-2xl bg-bg-light/60 dark:bg-bg-dark/60 border border-card-border-light dark:border-card-border-dark">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950 text-accent flex items-center justify-center font-bold text-xs flex-shrink-0">
          {getInitials(member.display_name, member.email)}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-text-primary-light dark:text-text-primary-dark truncate">
              {member.display_name || member.email.split('@')[0]}
            </span>
            {isCurrentUser && (
              <span className="text-[10px] text-text-secondary-light dark:text-text-secondary-dark">(Siz)</span>
            )}
          </div>
          <p className="text-[11px] text-text-secondary-light dark:text-text-secondary-dark truncate">
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
            className="p-1 rounded-lg text-text-secondary-light hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 transition-colors"
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
