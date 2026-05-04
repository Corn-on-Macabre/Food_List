-- Migration: Create profiles table for visitor/admin user data
-- Story 8-1: Google Sign-in for Visitors

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  google_id text,
  display_name text,
  email text,
  avatar_url text,
  date_joined timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can insert their own profile (first sign-in)
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Admin can read all profiles (uses VITE_ADMIN_EMAIL matched against email column)
CREATE POLICY "Admin can read all profiles"
  ON profiles FOR SELECT
  USING (
    auth.jwt() ->> 'email' = current_setting('app.admin_email', true)
    OR auth.uid() = id
  );
