-- Named, ordered, annotated restaurant collections ("Visiting Phoenix? Start
-- here") served publicly at bobby.menu/c/<slug>. Created/edited only via the
-- authed MCP tools (service key — bypasses RLS); link-only discovery.

CREATE TABLE collections (
  slug text PRIMARY KEY,
  title text NOT NULL,
  blurb text,
  restaurant_ids jsonb NOT NULL DEFAULT '[]',  -- ordered array of restaurant slugs
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE collections ENABLE ROW LEVEL SECURITY;

-- Anyone (anon key) can read; no write policies — service key only.
CREATE POLICY "Public read collections" ON collections FOR SELECT USING (true);
