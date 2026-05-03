import { supabase } from '../lib/supabase';

export interface Submission {
  id: string;
  user_id: string;
  user_display_name: string | null;
  restaurant_name: string;
  location: string;
  user_note: string | null;
  status: 'pending' | 'approved' | 'dismissed';
  created_at: string;
}

export interface SubmitData {
  restaurant_name: string;
  location: string;
  user_note?: string;
}

/** Insert a new submission for the current authenticated user. */
export async function submitRestaurant(data: SubmitData): Promise<Submission> {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) throw new Error('You must be signed in to submit a restaurant.');

  const metadata = user.user_metadata as Record<string, unknown> | undefined;
  const displayName =
    (metadata?.full_name as string) ??
    (metadata?.name as string) ??
    user.email ??
    'Anonymous';

  const { data: row, error } = await supabase
    .from('submissions')
    .insert({
      user_id: user.id,
      user_display_name: displayName,
      restaurant_name: data.restaurant_name,
      location: data.location,
      user_note: data.user_note ?? null,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to submit: ${error.message}`);
  return row as Submission;
}

/** Count the current user's submissions created today (UTC). Used for rate limiting. */
export async function fetchMySubmissionsToday(): Promise<number> {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) return 0;

  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  const { count, error } = await supabase
    .from('submissions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', todayStart.toISOString());

  if (error) throw new Error(`Failed to check submissions: ${error.message}`);
  return count ?? 0;
}

/** Fetch all pending submissions (admin only — RLS enforced). */
export async function fetchPendingSubmissions(): Promise<Submission[]> {
  const { data, error } = await supabase
    .from('submissions')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch submissions: ${error.message}`);
  return data as Submission[];
}

/** Update a submission's status to approved or dismissed (admin only). */
export async function updateSubmissionStatus(
  id: string,
  status: 'approved' | 'dismissed',
): Promise<void> {
  const { error } = await supabase
    .from('submissions')
    .update({ status })
    .eq('id', id);

  if (error) throw new Error(`Failed to update submission: ${error.message}`);
}
