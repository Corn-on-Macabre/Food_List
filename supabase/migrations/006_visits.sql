-- Structured visit log: one row per visit, written by the MCP log_visit tool
-- (service key). PRIVATE — spend and party size must never be readable via
-- the public anon key, so there is no anon policy and no write policies.
--
-- NOTE: the admin email is hardcoded in the policy. Supabase's postgres role
-- cannot ALTER DATABASE ... SET, so the app.admin_email GUC used by earlier
-- migrations never actually worked (see 008, which fixes those policies).

CREATE TABLE visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id text NOT NULL,   -- restaurant slug; intentionally NO FK so deleting a restaurant keeps visit history
  restaurant_name text,          -- snapshot for orphan-tolerant reporting
  visited_on date NOT NULL,
  note text,
  dishes text[],
  spend_cents integer CHECK (spend_cents >= 0),
  party_size integer CHECK (party_size > 0),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_visits_restaurant ON visits (restaurant_id);
CREATE INDEX idx_visits_date ON visits (visited_on);

ALTER TABLE visits ENABLE ROW LEVEL SECURITY;

-- Admin-only read (frontend /stats page with the admin's Google session).
CREATE POLICY "Admin read visits" ON visits FOR SELECT TO authenticated
  USING ((auth.jwt() ->> 'email') = 'bobbyhunnicutt@gmail.com');
