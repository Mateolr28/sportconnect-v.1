import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { SportsHistoryEntry } from '../types';


export const historyService = {
  async getSportsHistory(userId: string): Promise<SportsHistoryEntry[]> {
    if (!isSupabaseConfigured()) return [];
    const { data, error } = await supabase
      .from('sports_history')
      .select('*')
      .eq('user_id', userId)
      .order('fecha_inicio', { ascending: false });
    if (error) throw error;
    return (data as SportsHistoryEntry[]) || [];
  },

  async addSportsHistory(
    userId: string,
    entry: Pick<SportsHistoryEntry, 'tipo' | 'titulo' | 'detalle' | 'fecha_inicio' | 'fecha_fin'>
  ): Promise<SportsHistoryEntry> {
    const { data, error } = await supabase
      .from('sports_history')
      .insert({ ...entry, user_id: userId })
      .select()
      .single();
    if (error) throw error;
    return data as SportsHistoryEntry;
  },

  async deleteSportsHistory(id: string, userId: string): Promise<void> {
    const { error } = await supabase.from('sports_history').delete().eq('id', id).eq('user_id', userId);
    if (error) throw error;
  },
};
