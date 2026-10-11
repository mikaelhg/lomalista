import { describe, expect, it } from '@rstest/core';
import { addDays, defaultSeason, formatDate, isoWeek, parseDate } from '../lib/dates';
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
  it('picks default season', () => {
    expect(defaultSeason('2026-10-11')).toEqual({ start: '2027-06-01', end: '2027-08-31' });
    expect(defaultSeason('2026-04-01')).toEqual({ start: '2026-06-01', end: '2026-08-31' });
  });
});
