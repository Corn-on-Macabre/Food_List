-- Fix the admin RLS policies from 001/002/003.
--
-- They all keyed off current_setting('app.admin_email', true), assuming the
-- GUC would be set via ALTER DATABASE — but Supabase's postgres role is not
-- allowed to set database-level parameters (42501), so the setting was NULL
-- from day one. Consequences:
--   * 001's "OR current_setting IS NULL" escape hatch meant ANY signed-in
--     Google user could insert/update/delete restaurants via the anon API.
--   * 002/003's admin read/update policies always evaluated NULL → the
--     admin's Supabase session never matched (failed closed).
-- Hardcoding the curator email removes the broken indirection.

-- 001 restaurants: close the escape hatch
DROP POLICY IF EXISTS "Admin insert" ON restaurants;
DROP POLICY IF EXISTS "Admin update" ON restaurants;
DROP POLICY IF EXISTS "Admin delete" ON restaurants;

CREATE POLICY "Admin insert" ON restaurants FOR INSERT TO authenticated
  WITH CHECK ((auth.jwt() ->> 'email') = 'bobbyhunnicutt@gmail.com');
CREATE POLICY "Admin update" ON restaurants FOR UPDATE TO authenticated
  USING ((auth.jwt() ->> 'email') = 'bobbyhunnicutt@gmail.com');
CREATE POLICY "Admin delete" ON restaurants FOR DELETE TO authenticated
  USING ((auth.jwt() ->> 'email') = 'bobbyhunnicutt@gmail.com');

-- 002 profiles: make the admin read-all policy actually work
DROP POLICY IF EXISTS "Admin can read all profiles" ON profiles;
CREATE POLICY "Admin can read all profiles" ON profiles FOR SELECT
  USING (
    (auth.jwt() ->> 'email') = 'bobbyhunnicutt@gmail.com'
    OR auth.uid() = id
  );

-- 003 submissions: make the admin review queue actually work
DROP POLICY IF EXISTS "Admin can view all submissions" ON submissions;
DROP POLICY IF EXISTS "Admin can update submissions" ON submissions;
CREATE POLICY "Admin can view all submissions" ON submissions FOR SELECT
  USING ((auth.jwt() ->> 'email') = 'bobbyhunnicutt@gmail.com');
CREATE POLICY "Admin can update submissions" ON submissions FOR UPDATE TO authenticated
  USING ((auth.jwt() ->> 'email') = 'bobbyhunnicutt@gmail.com');
