import { type CalendarDate, getWeeksInMonth, parseDate, startOfWeek } from '@internationalized/date';
import {
  Button,
  CalendarCell,
  CalendarGrid,
  DateInput,
  DateRangePicker,
  DateSegment,
  Dialog,
  FieldError,
  Group,
  Heading,
  I18nProvider,
  Label,
  Popover,
  RangeCalendar,
} from 'react-aria-components';
import { isoWeek } from '../lib/dates';
import { locale, t } from '../lib/i18n';

/** A range of YYYY-MM-DD strings, the format the API uses. */
export interface Range {
  start: string;
  end: string;
}

interface Props {
  label: string;
  value: Range | null;
  onChange: (r: Range | null) => void;
  min?: string;
  max?: string;
  required?: boolean;
}

const toDate = (s?: string): CalendarDate | undefined => (s ? parseDate(s) : undefined);

/** ISO week numbers for the rows of the month starting at `first`. */
export function monthWeeks(first: CalendarDate): number[] {
  const monday = startOfWeek(first, locale, 'mon');
  return Array.from({ length: getWeeksInMonth(first, locale, 'mon') }, (_, i) =>
    isoWeek(monday.add({ weeks: i })),
  );
}

const segment =
  'rounded-sm px-px tabular-nums outline-none data-focused:bg-accent data-focused:text-accent-fg data-placeholder:text-muted';
const navButton =
  'cursor-pointer rounded-md px-2 py-1 text-lg data-disabled:cursor-default data-disabled:opacity-30';
const cell =
  'flex size-9 cursor-pointer items-center justify-center rounded-md text-sm outline-none ' +
  'data-outside-month:hidden data-disabled:cursor-default data-disabled:text-muted data-disabled:opacity-40 ' +
  'data-selected:rounded-none data-selected:bg-accent/25 ' +
  'data-selection-start:rounded-l-md data-selection-start:bg-accent data-selection-start:text-accent-fg ' +
  'data-selection-end:rounded-r-md data-selection-end:bg-accent data-selection-end:text-accent-fg ' +
  'data-focus-visible:outline-[3px] data-focus-visible:outline-accent';

export function DateRange({ label, value, onChange, min, max, required }: Props) {
  return (
    <I18nProvider locale={locale}>
      <DateRangePicker
        className="mb-3 flex flex-col gap-1"
        value={value ? { start: parseDate(value.start), end: parseDate(value.end) } : null}
        onChange={(r) => onChange(r ? { start: r.start.toString(), end: r.end.toString() } : null)}
        minValue={toDate(min)}
        maxValue={toDate(max)}
        isRequired={required}
      >
        <Label className="text-[.9rem] text-muted">{label}</Label>
        <Group className="flex w-fit items-center gap-1 rounded-md border border-line bg-bg py-1 pl-2 pr-1 data-focus-within:border-accent data-invalid:border-err">
          <DateInput slot="start" className="flex">
            {(s) => <DateSegment segment={s} className={segment} />}
          </DateInput>
          <span aria-hidden="true">–</span>
          <DateInput slot="end" className="flex">
            {(s) => <DateSegment segment={s} className={segment} />}
          </DateInput>
          <Button className="ml-1 cursor-pointer rounded-md px-2 py-1 text-muted data-hovered:bg-line/50">
            ▾
          </Button>
        </Group>
        <FieldError className="text-[.85rem] text-err" />
        <Popover className="rounded-lg border border-line bg-card p-3 shadow-lg">
          <Dialog className="outline-none">
            <RangeCalendar>
              {({ state }) => (
                <>
                  <header className="mb-2 flex items-center justify-between gap-2">
                    <Button slot="previous" className={navButton}>
                      ‹
                    </Button>
                    <Heading className="font-bold" />
                    <Button slot="next" className={navButton}>
                      ›
                    </Button>
                  </header>
                  <div className="flex gap-1">
                    {/* Week numbers are visual only; the grid itself carries the dates for assistive tech. */}
                    <div aria-hidden="true" className="text-xs text-muted">
                      <div className="flex h-6 items-start justify-center">{t('weekShort')}</div>
                      {monthWeeks(state.visibleRange.start as CalendarDate).map((w) => (
                        <div key={w} className="flex h-9 w-7 items-center justify-center">
                          {w}
                        </div>
                      ))}
                    </div>
                    <CalendarGrid className="border-collapse [&_td]:p-0 [&_th]:h-6 [&_th]:p-0 [&_th]:align-top [&_th]:text-xs [&_th]:font-normal [&_th]:text-muted">
                      {(date) => <CalendarCell date={date} className={cell} />}
                    </CalendarGrid>
                  </div>
                </>
              )}
            </RangeCalendar>
          </Dialog>
        </Popover>
      </DateRangePicker>
    </I18nProvider>
  );
}
