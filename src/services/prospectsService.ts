import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Prospect, ProspectStatus, Profile, AthleteProfile } from '../types';


export const prospectsService = {
  async getProspectIds(recruiterId: string): Promise<Record<string, ProspectStatus>> {
    if (!isSupabaseConfigured()) return {};
    const { data, error } = await supabase.from('prospects').select('athlete_id, estado').eq('recruiter_id', recruiterId);
    if (error) throw error;
    return Object.fromEntries((data || []).map((row) => [row.athlete_id as string, row.estado as ProspectStatus]));
  },

  async addProspect(recruiterId: string, athleteId: string): Promise<void> {
    const { error } = await supabase.from('prospects').insert({ recruiter_id: recruiterId, athlete_id: athleteId });
    // 23505: ya estaba en prospectos; se trata como éxito
    if (error && error.code !== '23505') throw error;
  },

  async updateProspect(
    recruiterId: string,
    athleteId: string,
    changes: { estado?: ProspectStatus; notas?: string | null }
  ): Promise<void> {
    const { error } = await supabase
      .from('prospects')
      .update({ ...changes, updated_at: new Date().toISOString() })
      .eq('recruiter_id', recruiterId)
      .eq('athlete_id', athleteId);
    if (error) throw error;
  },

  async removeProspect(recruiterId: string, athleteId: string): Promise<void> {
    const { error } = await supabase.from('prospects').delete().eq('recruiter_id', recruiterId).eq('athlete_id', athleteId);
    if (error) throw error;
  },

  async getProspects(recruiterId: string): Promise<Prospect[]> {
    if (!isSupabaseConfigured()) return [];
    const { data: rows, error } = await supabase
      .from('prospects')
      .select('*')
      .eq('recruiter_id', recruiterId)
      .order('updated_at', { ascending: false });
    if (error) throw error;

    const prospects = (rows as Prospect[]) || [];
    if (!prospects.length) return [];
    const ids = prospects.map((p) => p.athlete_id);

    const [profilesRes, athletesRes] = await Promise.all([
      supabase.from('profiles').select('*').in('id', ids),
      supabase.from('athlete_profiles').select('*').in('user_id', ids),
    ]);
    if (profilesRes.error) throw profilesRes.error;
    if (athletesRes.error) throw athletesRes.error;

    const profileById = new Map(((profilesRes.data as Profile[]) || []).map((p) => [p.id, p]));
    const athleteById = new Map(((athletesRes.data as AthleteProfile[]) || []).map((a) => [a.user_id, a]));
    return prospects.map((p) => ({
      ...p,
      athlete_profile: profileById.get(p.athlete_id),
      athlete: athleteById.get(p.athlete_id) || null,
    }));
  },
};
