const DAY_MS = 86_400_000;

/** Parses YYYY-MM-DD as a UTC date, so arithmetic is unaffected by DST. */
export function parseDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function addDays(d: Date, n: number): Date {
  return new Date(d.getTime() + n * DAY_MS);
}

export function diffDays(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / DAY_MS);
}

/** Monday = 0 … Sunday = 6 */
export function weekday(d: Date): number {
  return (d.getUTCDay() + 6) % 7;
}

export function isoWeek(d: Date): number {
  const t = new Date(d.getTime());
  t.setUTCDate(t.getUTCDate() + 3 - weekday(t));
  const week1 = new Date(Date.UTC(t.getUTCFullYear(), 0, 4));
  return 1 + Math.round((diffDays(week1, t) - 3 + weekday(week1)) / 7);
}

export function todayLocal(): string {
  const n = new Date();
  return formatDate(new Date(Date.UTC(n.getFullYear(), n.getMonth(), n.getDate())));
}

/** Adds calendar months, clamping to the month's last day like the backend does. */
export function addMonths(s: string, n: number): string {
  const d = parseDate(s);
  const first = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + n, 1));
  const last = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
  first.setUTCDate(Math.min(d.getUTCDate(), last));
  return formatDate(first);
}

/** Whole weeks (Monday to Sunday) covering every vacation, or null if there are none. */
export function vacationSpan(ranges: { start: string; end: string }[]): { start: Date; end: Date } | null {
  if (ranges.length === 0) return null;
  const first = parseDate(ranges.reduce((m, r) => (r.start < m ? r.start : m), ranges[0].start));
  const last = parseDate(ranges.reduce((m, r) => (r.end > m ? r.end : m), ranges[0].end));
  return { start: addDays(first, -weekday(first)), end: addDays(last, 6 - weekday(last)) };
}
