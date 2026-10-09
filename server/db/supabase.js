import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

// Ensure .env is loaded if running in standalone mode outside Vite
try {
  if (typeof process.loadEnvFile === 'function') {
    process.loadEnvFile();
  } else {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf-8');
      for (const line of content.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const idx = trimmed.indexOf('=');
          const k = trimmed.slice(0, idx).trim();
          const v = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
          if (!process.env[k]) {
            process.env[k] = v;
          }
        }
      }
    }
  }
} catch {
  // Silent fallback
}

// Read configuration from environment
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

let supabase = null;

if (supabaseUrl && supabaseKey && !supabaseUrl.includes('your-project-id')) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    console.log('[CBFIS Sovereign DB] Supabase Client Initialized with URL:', supabaseUrl);
  } catch (err) {
    console.warn('[CBFIS Sovereign DB] Failed to initialize Supabase client:', err.message);
    supabase = null;
  }
} else {
  console.log('[CBFIS Sovereign DB] Operating in Local Sovereign Mode (server/data/db.json). Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable Cloud PostgreSQL.');
}

export function getSupabase() {
  return supabase;
}

export function isSupabaseConfigured() {
  return Boolean(supabase);
}

export function getSupabaseStatus() {
  return {
    configured: Boolean(supabase),
    url: supabaseUrl ? supabaseUrl.replace(/^(https:\/\/[^.]+).*/, '$1.supabase.co') : null,
    mode: supabase ? 'SUPABASE_CLOUD_POSTGRES' : 'LOCAL_SOVEREIGN_PERSISTENCE',
  };
}
