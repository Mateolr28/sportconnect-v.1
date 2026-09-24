import { createClient } from '@supabase/supabase-js';

// Obtenemos las variables de entorno de Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Determinamos si las credenciales son válidas y están configuradas
export const isSupabaseConfigured = (): boolean => {
  return (
    Boolean(supabaseUrl) &&
    Boolean(supabaseAnonKey) &&
    !supabaseUrl.includes('tu-proyecto') &&
    !supabaseAnonKey.includes('tu-anon-key') &&
    supabaseUrl.startsWith('https://')
  );
};

// Si no están configuradas, se usa un mock seguro para evitar que la aplicación crashee
const fallbackUrl = 'https://mock-sportconnect.supabase.co';
const fallbackKey = 'mock-anon-key';

export const supabase = createClient(
  isSupabaseConfigured() ? supabaseUrl : fallbackUrl,
  isSupabaseConfigured() ? supabaseAnonKey : fallbackKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
);
