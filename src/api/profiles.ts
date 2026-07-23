import { userDisplayFields } from './userMetadata';
import { supabase, supabaseConfigured } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

/**
 * Upserts a profile row for the given Supabase user.
 * Called after sign-in to keep profile data in sync with the Google account.
 * Silently fails if Supabase is not configured or the upsert errors —
 * profile creation is non-blocking to the auth flow.
 */
export async function upsertProfile(user: User): Promise<void> {
  if (!supabaseConfigured) return;

  const metadata = user.user_metadata as Record<string, unknown> | undefined;
  const { displayName, avatarUrl } = userDisplayFields(user);

  await supabase.from('profiles').upsert(
    {
      id: user.id,
      google_id: (metadata?.sub as string) ?? null,
      display_name: displayName,
      email: user.email ?? null,
      avatar_url: avatarUrl,
    },
    { onConflict: 'id' }
  );
}
