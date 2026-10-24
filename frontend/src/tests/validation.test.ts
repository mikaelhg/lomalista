import { describe, expect, it } from '@rstest/core';
import { addDays, addMonths, formatDate, isoWeek, parseDate, vacationSpan } from '../lib/dates';
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
  });
  it('adds days across DST', () => {
    expect(formatDate(addDays(parseDate('2027-03-27'), 2))).toBe('2027-03-29');
  });
  it('adds months, clamping to the end of the month', () => {
    expect(addMonths('2026-10-24', 18)).toBe('2028-04-24');
    expect(addMonths('2026-08-31', 18)).toBe('2028-02-29');
  });
  it('spans whole weeks around all vacations', () => {
    expect(vacationSpan([])).toBeNull();
    const span = vacationSpan([
      { start: '2027-07-07', end: '2027-07-09' },
      { start: '2027-06-02', end: '2027-06-03' },
    ]);
    expect(span && [formatDate(span.start), formatDate(span.end)]).toEqual(['2027-05-31', '2027-07-11']);
  });
});
