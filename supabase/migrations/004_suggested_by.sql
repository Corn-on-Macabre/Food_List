-- Migration: Add suggested_by attribution columns
-- Story 8-4: "Suggested By" Attribution on Detail Cards

-- Add attribution columns to restaurants table
ALTER TABLE restaurants ADD COLUMN suggested_by text;
ALTER TABLE restaurants ADD COLUMN suggested_by_avatar text;

-- Add avatar URL column to submissions table so it's available at approval time
ALTER TABLE submissions ADD COLUMN user_avatar_url text;
