-- Create restaurants table matching the Restaurant TypeScript interface
CREATE TABLE IF NOT EXISTS restaurants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('loved', 'recommended', 'on_my_radar')),
  cuisine TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  notes TEXT,
  "googleMapsUrl" TEXT NOT NULL,
  source TEXT,
  "dateAdded" TEXT NOT NULL,
  tags TEXT[],
  featured BOOLEAN DEFAULT FALSE,
  "enrichedAt" TEXT,
  rating DOUBLE PRECISION,
  "userRatingCount" INTEGER,
  "priceLevel" TEXT,
  "photoRef" TEXT
);

-- Indexes for common filter queries
CREATE INDEX IF NOT EXISTS idx_restaurants_cuisine ON restaurants (cuisine);
CREATE INDEX IF NOT EXISTS idx_restaurants_tier ON restaurants (tier);

-- Enable Row Level Security
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;

-- Public read access (anyone can SELECT)
CREATE POLICY "Public read access"
  ON restaurants
  FOR SELECT
  USING (true);

-- Admin write access (only authenticated users whose email matches admin allowlist)
-- The admin email is checked via the JWT claims set by Supabase Auth
CREATE POLICY "Admin insert"
  ON restaurants
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.jwt() ->> 'email') = current_setting('app.admin_email', true)
    OR current_setting('app.admin_email', true) IS NULL
  );

CREATE POLICY "Admin update"
  ON restaurants
  FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt() ->> 'email') = current_setting('app.admin_email', true)
    OR current_setting('app.admin_email', true) IS NULL
  );

CREATE POLICY "Admin delete"
  ON restaurants
  FOR DELETE
  TO authenticated
  USING (
    (auth.jwt() ->> 'email') = current_setting('app.admin_email', true)
    OR current_setting('app.admin_email', true) IS NULL
  );
