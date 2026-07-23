import type { User } from '@supabase/supabase-js';

/**
 * Extracts display name and avatar from a Supabase user's Google metadata.
 * Google puts these under full_name/name and avatar_url/picture depending on
 * the token shape — shared here so submissions and profiles can't drift.
 */
export function userDisplayFields(user: User): {
  displayName: string | null;
  avatarUrl: string | null;
} {
  const metadata = user.user_metadata as Record<string, unknown> | undefined;
  return {
    displayName: (metadata?.full_name as string) ?? (metadata?.name as string) ?? null,
    avatarUrl: (metadata?.avatar_url as string) ?? (metadata?.picture as string) ?? null,
  };
}
