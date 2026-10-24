import { useMemo } from 'react';
import type { Doc } from '../lib/api';
import { addDays, diffDays, formatDate, isoWeek, parseDate, vacationSpan, weekday } from '../lib/dates';
import { lang, t } from '../lib/i18n';

const DAY_W = 16;

const head = 'relative h-[1.4rem] text-xs text-muted';
const headLabel = 'absolute top-0 whitespace-nowrap pl-0.5';
const rowBox = 'h-7 leading-7';

export function Timeline({ doc, mine }: { doc: Doc; mine: Set<number> }) {
  const span = useMemo(() => vacationSpan(doc.people.flatMap((p) => p.vacations)), [doc]);
  const { days, counts, weeks, months } = useMemo(() => {
    if (!span) return { days: [], counts: [], weeks: [], months: [] };
    const { start } = span;
    const n = diffDays(start, span.end) + 1;
    const days = Array.from({ length: n }, (_, i) => addDays(start, i));
    const counts = new Array<number>(n).fill(0);
    for (const p of doc.people)
      for (const v of p.vacations) {
        const a = diffDays(start, parseDate(v.start));
        const b = diffDays(start, parseDate(v.end));
        for (let i = Math.max(a, 0); i <= Math.min(b, n - 1); i++) counts[i]++;
      }
    const weeks = days
      .map((d, i) => ({ d, i }))
      .filter(({ d, i }) => weekday(d) === 0 || i === 0)
      .map(({ d, i }) => ({ i, week: isoWeek(d) }));
    const fmt = new Intl.DateTimeFormat(lang, { month: 'short', timeZone: 'UTC' });
    const months = days
      .map((d, i) => ({ d, i }))
      .filter(({ d, i }) => d.getUTCDate() === 1 || i === 0)
      .map(({ d, i }) => ({ i, label: fmt.format(d) }));
    return { days, counts, weeks, months };
  }, [doc, span]);

  if (!span) return null;
  const { start } = span;
  const total = Math.max(doc.people.length, 1);
  const width = days.length * DAY_W;
  const dayFmt = new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'short', timeZone: 'UTC' });

  return (
    // biome-ignore lint/a11y/useSemanticElements: a fieldset would bring unwanted default styling
    <div
      className="flex overflow-hidden rounded-lg border border-line bg-card"
      role="group"
      aria-label="timeline"
    >
      <div className="w-34 shrink-0 border-r border-line">
        <div className={head} />
        <div className={`${head} border-b border-line`} />
        {doc.people.map((p) => (
          <div key={p.id} className={`${rowBox} truncate px-2 ${mine.has(p.id) ? 'font-bold' : ''}`}>
            {p.name}
          </div>
        ))}
        <div className={`${rowBox} truncate border-t border-line px-2 text-[.8rem] text-muted`}>
          {t('away')}
        </div>
      </div>
      <div className="flex-1 overflow-x-auto">
        <div style={{ width }}>
          <div className={head}>
            {months.map((m) => (
              <span key={m.i} className={headLabel} style={{ left: m.i * DAY_W }}>
                {m.label}
              </span>
            ))}
          </div>
          <div className={`${head} border-b border-line`}>
            {weeks.map((w) => (
              <span
                key={w.i}
                className={headLabel}
                style={{ left: w.i * DAY_W }}
                title={`${t('week')} ${w.week}`}
              >
                {w.week}
              </span>
            ))}
          </div>
          {doc.people.map((p) => (
            <div key={p.id} className={`${rowBox} relative`} style={{ width }}>
              {p.vacations.map((v) => {
                const a = diffDays(start, parseDate(v.start));
                const len = diffDays(parseDate(v.start), parseDate(v.end)) + 1;
                return (
                  <div
                    key={v.id}
                    className={`absolute top-[.3rem] h-[1.15rem] rounded-sm ${mine.has(p.id) ? 'bg-bar-mine' : 'bg-bar'}`}
                    style={{ left: a * DAY_W, width: len * DAY_W }}
                    title={`${p.name}: ${dayFmt.format(parseDate(v.start))} – ${dayFmt.format(parseDate(v.end))}`}
                  />
                );
              })}
            </div>
          ))}
          <div className={`${rowBox} relative border-t border-line`} style={{ width }}>
            {counts.map((c, i) => (
              <div
                key={formatDate(days[i])}
                className="absolute top-0 h-full text-center text-[.65rem] leading-7 text-fg"
                style={{
                  left: i * DAY_W,
                  width: DAY_W,
                  background: c
                    ? `color-mix(in srgb, var(--warn) ${Math.round((c / total) * 100)}%, transparent)`
                    : undefined,
                }}
                title={`${dayFmt.format(days[i])}: ${c}`}
              >
                {c || ''}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
