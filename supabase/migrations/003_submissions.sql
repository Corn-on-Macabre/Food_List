-- Migration: Create submissions table for community restaurant suggestions
-- Story 8-2: Submission Form & Review Queue

CREATE TABLE submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  user_display_name text,
  restaurant_name text NOT NULL,
  location text NOT NULL,
  user_note text,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'dismissed')),
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Users can read their own submissions
CREATE POLICY "Users can view own submissions"
  ON submissions FOR SELECT
  USING (auth.uid() = user_id);

-- Admin can read all submissions
CREATE POLICY "Admin can view all submissions"
  ON submissions FOR SELECT
  USING (
    (auth.jwt() ->> 'email') = current_setting('app.admin_email', true)
  );

-- Authenticated users can insert their own submissions
CREATE POLICY "Authenticated users can insert own submissions"
  ON submissions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Admin can update any submission (approve/dismiss)
CREATE POLICY "Admin can update submissions"
  ON submissions FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt() ->> 'email') = current_setting('app.admin_email', true)
  );
