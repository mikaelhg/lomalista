import { parseDate } from '@internationalized/date';
import { describe, expect, it } from '@rstest/core';
import { diffDays, isoWeek, vacationSpan, weekday } from '../lib/dates';
import { nameError } from '../lib/validation';

describe('nameError', () => {
  it('accepts Nordic names', () => {
    for (const n of ['Åsa', 'Jørgen', 'Þórunn', 'Anna-Liisa', 'Mari Ö', 'Åsa']) {
      expect(nameError(n), n).toBeNull();
    }
  });
  it('rejects others', () => {
    expect(nameError(' ')).toBe('name_empty');
    expect(nameError('abcdefghijklmnop')).toBe('name_too_long');
    for (const n of ['Bob1', '😀', '-Anna', 'Anna-', 'A  B', 'Žilvinas', '<b>']) {
      expect(nameError(n), n).toBe('name_chars');
    }
  });
});

describe('dates', () => {
  it('computes ISO weeks', () => {
    expect(isoWeek(parseDate('2027-01-01'))).toBe(53);
    expect(isoWeek(parseDate('2026-06-22'))).toBe(26);
    expect(isoWeek(parseDate('2024-12-30'))).toBe(1);
    expect(isoWeek(parseDate('2026-12-31'))).toBe(53);
    expect(isoWeek(parseDate('2027-01-04'))).toBe(1);
  });
  it('uses Monday-first weekdays', () => {
    expect(weekday(parseDate('2027-06-07'))).toBe(0);
    expect(weekday(parseDate('2027-06-13'))).toBe(6);
  });
  it('counts days across DST', () => {
    expect(diffDays(parseDate('2027-03-27'), parseDate('2027-03-29'))).toBe(2);
    expect(parseDate('2027-03-27').add({ days: 2 }).toString()).toBe('2027-03-29');
  });
  it('clamps added months to the end of the month, like the backend', () => {
    expect(parseDate('2026-10-24').add({ months: 18 }).toString()).toBe('2028-04-24');
    expect(parseDate('2026-08-31').add({ months: 18 }).toString()).toBe('2028-02-29');
  });
  it('spans whole weeks around all vacations', () => {
    expect(vacationSpan([])).toBeNull();
    const span = vacationSpan([
      { start: '2027-07-07', end: '2027-07-09' },
      { start: '2027-06-02', end: '2027-06-03' },
    ]);
    expect(span && [span.start.toString(), span.end.toString()]).toEqual(['2027-05-31', '2027-07-11']);
  });
});
