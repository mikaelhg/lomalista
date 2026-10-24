import { parseDate } from '@internationalized/date';
import { describe, expect, it } from '@rstest/core';
import { monthWeeks } from '../components/DateRange';

describe('calendar week numbers', () => {
  it('labels each row of a month with its ISO week', () => {
    expect(monthWeeks(parseDate('2027-06-01'))).toEqual([22, 23, 24, 25, 26]);
  });

  it('handles weeks that belong to the previous year', () => {
    expect(monthWeeks(parseDate('2027-01-01'))).toEqual([53, 1, 2, 3, 4]);
  });
});
