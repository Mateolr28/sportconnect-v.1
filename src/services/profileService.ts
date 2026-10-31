import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Profile, AthleteProfile, RecruiterProfile, AthleteSearchResult } from '../types';


export const profileService = {
  async searchAthletes(): Promise<AthleteSearchResult[]> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase no está configurado. Verifica VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.');
    }

    const { data, error } = await supabase
      .from('athlete_profiles')
      .select('*, profile:profiles!athlete_profiles_user_id_fkey(*)')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return ((data as Array<AthleteProfile & { profile?: Profile | Profile[] }>) || [])
      .map((row) => {
        const profile = Array.isArray(row.profile) ? row.profile[0] : row.profile;
        const { profile: _profile, ...athlete } = row;
        return profile ? { profile, athlete: athlete as AthleteProfile } : null;
      })
      .filter((result): result is AthleteSearchResult => result !== null);
  },

  async getProfile(userId: string): Promise<{ profile: Profile | null; athlete?: AthleteProfile | null; recruiter?: RecruiterProfile | null }> {
    if (isSupabaseConfigured()) {
      try {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
        if (profile) {
          if (profile.rol === 'deportista') {
            const { data: athlete } = await supabase.from('athlete_profiles').select('*').eq('user_id', userId).maybeSingle();
            return { profile, athlete: athlete || null, recruiter: null };
          } else {
            const { data: recruiter } = await supabase.from('recruiter_profiles').select('*').eq('user_id', userId).maybeSingle();
            return { profile, athlete: null, recruiter: recruiter || null };
          }
        }
      } catch (err) {
        console.warn('Error obteniendo perfil de Supabase:', err);
      }
    }

    return { profile: null, athlete: null, recruiter: null };
  },
};
