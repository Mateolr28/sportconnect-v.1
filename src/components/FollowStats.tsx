import React from 'react';

export type FollowListType = 'followers' | 'following';

interface FollowStatsProps {
  followers: number;
  following: number;
  onOpenList?: (type: FollowListType) => void;
}

export const FollowStats: React.FC<FollowStatsProps> = ({ followers, following, onOpenList }) => (
  <div className="flex items-center gap-5 text-sm">
    <button
      type="button"
      onClick={() => onOpenList?.('followers')}
      className="flex items-baseline gap-1.5 hover:opacity-80 transition-opacity"
    >
      <span className="font-bold text-white">{followers}</span>
      <span className="text-xs text-slate-300">{followers === 1 ? 'seguidor' : 'seguidores'}</span>
    </button>
    <button
      type="button"
      onClick={() => onOpenList?.('following')}
      className="flex items-baseline gap-1.5 hover:opacity-80 transition-opacity"
    >
      <span className="font-bold text-white">{following}</span>
      <span className="text-xs text-slate-300">seguidos</span>
    </button>
  </div>
);
