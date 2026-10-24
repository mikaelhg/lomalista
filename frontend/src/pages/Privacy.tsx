import { card } from '../components/ui';
import { parseDate } from '../lib/dates';
import { lang } from '../lib/i18n';
import { controller, policies, updated } from '../lib/privacy';

export function Privacy() {
  const p = policies[lang] ?? policies.en;
  const date = new Intl.DateTimeFormat(lang, { dateStyle: 'long', timeZone: 'UTC' }).format(
    parseDate(updated),
  );
  return (
    <article className={card()}>
      <h1 className="mb-1 mt-2 text-2xl font-bold">{p.title}</h1>
      <p className="mb-4 text-[.875rem] text-muted">
        {p.updatedLabel} {date}
      </p>
      <section className="mb-4">
        <h2 className="mb-1 text-[1.1rem] font-bold">{p.controllerTitle}</h2>
        <p>{controller.name}</p>
        <p>
          {p.controllerContact}: {controller.contact}
        </p>
      </section>
      {p.sections.map((s) => (
        <section key={s.title} className="mb-4">
          <h2 className="mb-1 text-[1.1rem] font-bold">{s.title}</h2>
          {s.body.map((para) => (
            <p key={para} className="mb-2">
              {para}
            </p>
          ))}
        </section>
      ))}
    </article>
  );
}
