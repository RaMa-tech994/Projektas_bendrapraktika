import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const isSupabaseConfigured = Boolean(url && key);
export const supabase = isSupabaseConfigured ? createClient(url, key) : null;

export function requireSupabase() {
  if (!supabase) throw new Error('Supabase nesukonfigūruotas. Nustatykite VITE_SUPABASE_URL ir VITE_SUPABASE_PUBLISHABLE_KEY.');
  return supabase;
}
