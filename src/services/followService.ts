import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Profile } from '../types';

// Estado local reactivo cuando opera en modo offline / pre-configuración
let localFollows: Array<{ follower_id: string; following_id: string }> = [];

export const followService = {
  async followUser(followerId: string, followingId: string): Promise<void> {
    if (followerId === followingId) throw new Error('No puedes seguirte a ti mismo.');
    if (isSupabaseConfigured()) {
      const { error } = await supabase.from('follows').insert({ follower_id: followerId, following_id: followingId });
      // 23505: ya lo seguía; se trata como éxito
      if (error && error.code !== '23505') throw error;
      return;
    }
    if (!localFollows.some((f) => f.follower_id === followerId && f.following_id === followingId)) {
      localFollows.push({ follower_id: followerId, following_id: followingId });
    }
  },

  async unfollowUser(followerId: string, followingId: string): Promise<void> {
    if (isSupabaseConfigured()) {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', followerId)
        .eq('following_id', followingId);
      if (error) throw error;
      return;
    }
    localFollows = localFollows.filter((f) => !(f.follower_id === followerId && f.following_id === followingId));
  },

  async getFollowingIds(userId: string): Promise<string[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('follows').select('following_id').eq('follower_id', userId);
      if (error) throw error;
      return (data || []).map((row) => row.following_id as string);
    }
    return localFollows.filter((f) => f.follower_id === userId).map((f) => f.following_id);
  },

  async getFollowCounts(userId: string): Promise<{ followers: number; following: number }> {
    if (isSupabaseConfigured()) {
      const [followers, following] = await Promise.all([
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', userId),
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', userId),
      ]);
      if (followers.error) throw followers.error;
      if (following.error) throw following.error;
      return { followers: followers.count ?? 0, following: following.count ?? 0 };
    }
    return {
      followers: localFollows.filter((f) => f.following_id === userId).length,
      following: localFollows.filter((f) => f.follower_id === userId).length,
    };
  },

  async getFollowList(userId: string, type: 'followers' | 'following'): Promise<Profile[]> {
    if (!isSupabaseConfigured()) return [];

    const ownColumn = type === 'followers' ? 'following_id' : 'follower_id';
    const otherColumn = type === 'followers' ? 'follower_id' : 'following_id';
    const { data: rows, error } = await supabase
      .from('follows')
      .select(otherColumn)
      .eq(ownColumn, userId)
      .order('created_at', { ascending: false });
    if (error) throw error;

    const ids = ((rows as unknown as Array<Record<string, string>>) || []).map((row) => row[otherColumn]);
    if (!ids.length) return [];

    const { data: profiles, error: profilesError } = await supabase.from('profiles').select('*').in('id', ids);
    if (profilesError) throw profilesError;
    // Conserva el orden de más reciente a más antiguo
    const byId = new Map(((profiles as Profile[]) || []).map((p) => [p.id, p]));
    return ids.map((id) => byId.get(id)).filter((p): p is Profile => Boolean(p));
  },
};
