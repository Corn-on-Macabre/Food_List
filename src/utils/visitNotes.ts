export interface VisitEntry {
  date: string; // YYYY-MM-DD
  text: string;
}

const VISIT_LINE = /^\[visited (\d{4}-\d{2}-\d{2})\]\s*(.*)$/;

/**
 * Splits a notes field into the original curator note and the dated visit
 * entries appended by the MCP log_visit tool (lines beginning with
 * "[visited YYYY-MM-DD]").
 */
export function splitNotes(notes: string | undefined): { note: string; visits: VisitEntry[] } {
  if (!notes) return { note: '', visits: [] };
  const noteLines: string[] = [];
  const visits: VisitEntry[] = [];
  for (const line of notes.split('\n')) {
    const m = line.match(VISIT_LINE);
    if (m) {
      visits.push({ date: m[1], text: m[2] });
    } else if (line.trim()) {
      noteLines.push(line.trim());
    }
  }
  return { note: noteLines.join(' '), visits };
}

/** "2026-07-18" → "Jul 18, 2026" (parsed as plain date, no timezone shifts) */
export function formatVisitDate(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
