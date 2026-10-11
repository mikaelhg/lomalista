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

/** Season suggested on the create form: the coming (or current) summer. */
export function defaultSeason(today: string): { start: string; end: string } {
  const y = Number(today.slice(0, 4));
  const year = today > `${y}-08-31` ? y + 1 : y;
  return { start: `${year}-06-01`, end: `${year}-08-31` };
}
