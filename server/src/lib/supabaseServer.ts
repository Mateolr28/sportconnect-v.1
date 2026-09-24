import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

export const isServerSupabaseConfigured = (): boolean => {
  return (
    Boolean(supabaseUrl) &&
    (Boolean(supabaseServiceRoleKey) || Boolean(supabaseAnonKey)) &&
    !supabaseUrl.includes('tu-proyecto') &&
    supabaseUrl.startsWith('https://')
  );
};

// Cliente con privilegios administrativos para el servidor Express
export const supabaseAdmin = createClient(
  isServerSupabaseConfigured() ? supabaseUrl : 'https://mock-sportconnect.supabase.co',
  supabaseServiceRoleKey || supabaseAnonKey || 'mock-service-key',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
