import { type CalendarDate, endOfWeek, getDayOfWeek, parseDate, startOfWeek } from '@internationalized/date';
import { lang } from './i18n';

// Dates are `CalendarDate`s from @internationalized/date: plain calendar days with no time or
// time zone, so arithmetic is unaffected by DST. The API exchanges them as YYYY-MM-DD strings
// (`parseDate` / `toString()`).

/** Any locale works here: every week helper below is pinned to Monday-first weeks. */
const WEEK_LOCALE = 'en-GB';

/** Number of days from `a` to `b`. */
export function diffDays(a: CalendarDate, b: CalendarDate): number {
  return b.compare(a);
}

/** Monday = 0 … Sunday = 6 */
export function weekday(d: CalendarDate): number {
  return getDayOfWeek(d, WEEK_LOCALE, 'mon');
}

/** ISO 8601 week number: weeks start on Monday and belong to the year of their Thursday. */
export function isoWeek(d: CalendarDate): number {
  const thursday = d.add({ days: 3 - weekday(d) });
  return Math.floor(thursday.compare(thursday.set({ month: 1, day: 1 })) / 7) + 1;
}

/** Returns a formatter for dates in the UI language. */
export function dateFormat(options: Intl.DateTimeFormatOptions): (d: CalendarDate) => string {
  const f = new Intl.DateTimeFormat(lang, { ...options, timeZone: 'UTC' });
  return (d) => f.format(d.toDate('UTC'));
}

/** Whole weeks (Monday to Sunday) covering every vacation, or null if there are none. */
export function vacationSpan(
  ranges: { start: string; end: string }[],
): { start: CalendarDate; end: CalendarDate } | null {
  if (ranges.length === 0) return null;
  // YYYY-MM-DD strings sort chronologically
  const first = parseDate(ranges.reduce((m, r) => (r.start < m ? r.start : m), ranges[0].start));
  const last = parseDate(ranges.reduce((m, r) => (r.end > m ? r.end : m), ranges[0].end));
  return {
    start: startOfWeek(first, WEEK_LOCALE, 'mon'),
    end: endOfWeek(last, WEEK_LOCALE, 'mon'),
  };
}
