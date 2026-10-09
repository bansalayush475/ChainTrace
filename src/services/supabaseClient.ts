import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || '';
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '';

let supabaseInstance: SupabaseClient | null = null;

const isConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('your-project-id') &&
  supabaseUrl.startsWith('https://')
);

if (isConfigured) {
  try {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    console.log('[Supabase Web SDK] Connected to Supabase Cloud:', supabaseUrl);
  } catch (err) {
    console.warn('[Supabase Web SDK] Initialization error:', err);
    supabaseInstance = null;
  }
}

export const supabase = supabaseInstance;

export function isSupabaseConnected(): boolean {
  return Boolean(supabaseInstance);
}

export function getSupabaseConfig() {
  return {
    url: supabaseUrl || null,
    connected: isSupabaseConnected(),
    mode: isSupabaseConnected() ? 'SUPABASE_CLOUD' : 'SOVEREIGN_LOCAL_FALLBACK',
  };
}
