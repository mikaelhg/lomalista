import { useMemo } from 'react';
import type { Doc } from './api';
import { addDays, diffDays, formatDate, isoWeek, parseDate, weekday } from './dates';
import { lang, t } from './i18n';

const DAY_W = 16;

export function Timeline({ doc, mine }: { doc: Doc; mine: Set<number> }) {
  const { days, counts, weeks, months } = useMemo(() => {
    const start = parseDate(doc.season_start);
    const n = diffDays(start, parseDate(doc.season_end)) + 1;
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
  }, [doc]);

  const start = parseDate(doc.season_start);
  const total = Math.max(doc.people.length, 1);
  const width = days.length * DAY_W;
  const dayFmt = new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'short', timeZone: 'UTC' });

  return (
    <div className="timeline" role="group" aria-label="timeline">
      <div className="tl-names">
        <div className="tl-head" />
        <div className="tl-head" />
        {doc.people.map((p) => (
          <div key={p.id} className={mine.has(p.id) ? 'tl-name mine' : 'tl-name'}>
            {p.name}
          </div>
        ))}
        <div className="tl-name tl-count-label">{t('away')}</div>
      </div>
      <div className="tl-scroll">
        <div style={{ width }}>
          <div className="tl-head tl-months">
            {months.map((m) => (
              <span key={m.i} style={{ left: m.i * DAY_W }}>{m.label}</span>
            ))}
          </div>
          <div className="tl-head tl-weeks">
            {weeks.map((w) => (
              <span key={w.i} style={{ left: w.i * DAY_W }} title={`${t('week')} ${w.week}`}>
                {w.week}
              </span>
            ))}
          </div>
          {doc.people.map((p) => (
            <div key={p.id} className="tl-row" style={{ width }}>
              {p.vacations.map((v) => {
                const a = diffDays(start, parseDate(v.start));
                const len = diffDays(parseDate(v.start), parseDate(v.end)) + 1;
                return (
                  <div
                    key={v.id}
                    className={mine.has(p.id) ? 'tl-bar mine' : 'tl-bar'}
                    style={{ left: a * DAY_W, width: len * DAY_W }}
                    title={`${p.name}: ${dayFmt.format(parseDate(v.start))} – ${dayFmt.format(parseDate(v.end))}`}
                  />
                );
              })}
            </div>
          ))}
          <div className="tl-row tl-counts" style={{ width }}>
            {counts.map((c, i) => (
              <div
                key={formatDate(days[i])}
                className="tl-cell"
                style={{
                  left: i * DAY_W,
                  width: DAY_W,
                  background: c ? `color-mix(in srgb, var(--warn) ${Math.round((c / total) * 100)}%, transparent)` : undefined,
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
