-- The admin editor chips wrote 'kid-friendly' (hyphen) while the canonical
-- TAG_VOCABULARY (frontend filter + server/data.js + MCP validation) uses
-- 'kid friendly' (space), so those tags never matched the public filter.
-- The chips now use the vocabulary form; normalize existing rows.

UPDATE restaurants
SET tags = array_replace(tags, 'kid-friendly', 'kid friendly')
WHERE 'kid-friendly' = ANY(tags);
