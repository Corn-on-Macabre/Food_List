import type { Restaurant } from '../types';
import { supabase, supabaseConfigured } from '../lib/supabase';

// Admin mutations require a Supabase session (Google OAuth) — RLS enforces the
// admin policy server-side. The legacy password-bearer Express path was removed:
// it shipped a shared write credential in the public bundle.
function requireSupabase(): void {
  if (!supabaseConfigured) {
    throw new Error('Supabase is not configured — admin features are unavailable.');
  }
}

export async function fetchAllRestaurants(): Promise<Restaurant[]> {
  requireSupabase();
  const { data, error } = await supabase
    .from('restaurants')
    .select('*')
    .order('name');
  if (error) throw new Error(`Failed to fetch: ${error.message}`);
  return data as Restaurant[];
}

export async function addRestaurant(restaurant: Restaurant): Promise<Restaurant> {
  requireSupabase();
  const { data, error } = await supabase
    .from('restaurants')
    .insert(restaurant)
    .select()
    .single();
  if (error) throw new Error(`Failed to add: ${error.message}`);
  return data as Restaurant;
}

export async function updateRestaurant(id: string, changes: Partial<Restaurant>): Promise<Restaurant> {
  requireSupabase();
  const { data, error } = await supabase
    .from('restaurants')
    .update(changes)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(`Failed to update: ${error.message}`);
  return data as Restaurant;
}

export async function deleteRestaurant(id: string): Promise<void> {
  requireSupabase();
  const { error } = await supabase
    .from('restaurants')
    .delete()
    .eq('id', id);
  if (error) throw new Error(`Failed to delete: ${error.message}`);
}
