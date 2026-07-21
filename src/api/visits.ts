import { supabase, supabaseConfigured } from '../lib/supabase';
import type { Visit } from '../types/restaurant';

/**
 * Fetches the private visit log. RLS only grants SELECT to the signed-in
 * admin (auth email must match app.admin_email) — any other session gets
 * an empty result, and the anon key gets nothing.
 */
export async function fetchVisits(): Promise<Visit[]> {
  if (!supabaseConfigured) {
    throw new Error('Supabase is not configured');
  }
  const { data, error } = await supabase
    .from('visits')
    .select('*')
    .order('visited_on', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Visit[];
}
