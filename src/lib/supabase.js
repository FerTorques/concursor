import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const SUPABASE_TABLE = import.meta.env.VITE_SUPABASE_TABLE || 'cargos';

// Determinar si Supabase está configurado con credenciales válidas
export const isSupabaseConfigured = () => {
  return (
    typeof supabaseUrl === 'string' &&
    typeof supabaseAnonKey === 'string' &&
    supabaseUrl.trim() !== '' &&
    !supabaseUrl.includes('tu-proyecto.supabase.co') &&
    supabaseAnonKey.trim() !== '' &&
    !supabaseAnonKey.includes('tu-anon-key')
  );
};

export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  : null;
