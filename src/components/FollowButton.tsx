import React, { useState } from 'react';
import { UserPlus, UserCheck } from 'lucide-react';

interface FollowButtonProps {
  isFollowing: boolean;
  onToggle: () => Promise<void> | void;
  variant?: 'light' | 'dark';
  compact?: boolean;
}

export const FollowButton: React.FC<FollowButtonProps> = ({
  isFollowing,
  onToggle,
  variant = 'light',
  compact = false,
}) => {
  const [isBusy, setIsBusy] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isBusy) return;
    setIsBusy(true);
    try {
      await onToggle();
    } finally {
      setIsBusy(false);
    }
  };

  const size = compact ? 'px-3 py-1.5 text-xs' : 'px-5 py-2.5 text-xs';
  const style = isFollowing
    ? variant === 'dark'
      ? 'bg-white/10 text-white border border-white/30 hover:bg-white/20'
      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
    : 'bg-[#1E3A8A] text-white border border-transparent hover:bg-blue-900';

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isBusy}
      className={`flex items-center gap-1.5 rounded-xl font-semibold transition-colors disabled:opacity-60 ${size} ${style}`}
    >
      {isFollowing ? <UserCheck className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
      <span>{isFollowing ? 'Siguiendo' : 'Seguir'}</span>
    </button>
  );
};
