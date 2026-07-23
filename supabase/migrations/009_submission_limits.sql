-- Enforce submission abuse limits server-side.
--
-- The 5-per-day cap previously lived only in SubmissionForm.tsx, which any
-- signed-in user could bypass by calling the anon API directly (the INSERT
-- policy only checks auth.uid() = user_id). Enforce it in Postgres, plus
-- length caps on the free-text fields.

-- Length limits (generous vs. the form's own limits, but bounded)
ALTER TABLE submissions
  ADD CONSTRAINT submissions_restaurant_name_len CHECK (char_length(restaurant_name) <= 120),
  ADD CONSTRAINT submissions_location_len CHECK (char_length(location) <= 200),
  ADD CONSTRAINT submissions_user_note_len CHECK (user_note IS NULL OR char_length(user_note) <= 500),
  ADD CONSTRAINT submissions_display_name_len CHECK (user_display_name IS NULL OR char_length(user_display_name) <= 80);

-- Daily cap: max 5 submissions per user per rolling 24 hours.
-- SECURITY DEFINER so the count is not filtered by the caller's RLS view;
-- search_path pinned per SECURITY DEFINER best practice.
CREATE OR REPLACE FUNCTION enforce_submission_daily_cap()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (
    SELECT count(*)
    FROM submissions
    WHERE user_id = NEW.user_id
      AND created_at > now() - interval '24 hours'
  ) >= 5 THEN
    RAISE EXCEPTION 'Daily submission limit reached (5 per 24 hours)'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS submissions_daily_cap ON submissions;
CREATE TRIGGER submissions_daily_cap
  BEFORE INSERT ON submissions
  FOR EACH ROW
  EXECUTE FUNCTION enforce_submission_daily_cap();
