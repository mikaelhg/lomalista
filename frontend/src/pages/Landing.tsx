import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import type { Range } from '../components/DateRange';
import { DateRange } from '../components/DateRange';
import { Button, card, errorText } from '../components/ui';
import { api, errCode } from '../lib/api';
import { defaultSeason, todayLocal } from '../lib/dates';
import { t, tError } from '../lib/i18n';
import { navigate } from '../lib/navigate';

export function Landing() {
  const def = defaultSeason(todayLocal());
  const [season, setSeason] = useState<Range | null>(def);
  const [copied, setCopied] = useState(false);

  const create = useMutation({ mutationFn: (s: Range) => api.createDoc(s.start, s.end) });
  const id = create.data?.id;
  const url = id ? `${location.origin}/d/${id}` : '';

  if (id) {
    return (
      <section className={card()}>
        <h1 className="mb-4 mt-2 text-2xl font-bold">{t('shareTitle')}</h1>
        <p className="rounded-md bg-warn/20 p-3">{t('shareWarn')}</p>
        <input
          readOnly
          className="w-full"
          value={url}
          aria-label="URL"
          onFocus={(e) => e.currentTarget.select()}
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            onClick={() => {
              navigator.clipboard?.writeText(url).then(
                () => setCopied(true),
                () => {},
              );
            }}
          >
            {copied ? t('copied') : t('copy')}
          </Button>
          <Button variant="primary" onClick={() => navigate(`/d/${id}`)}>
            {t('open')}
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className={card()}>
      <h1 className="mb-4 mt-2 text-2xl font-bold">{t('createTitle')}</h1>
      <p>{t('tagline')}</p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (season) create.mutate(season);
        }}
      >
        <DateRange label={t('season')} required value={season} onChange={setSeason} />
        <Button variant="primary" disabled={create.isPending}>
          {t('create')}
        </Button>
        {create.error && (
          <p role="alert" className={errorText}>
            {tError(errCode(create.error))}
          </p>
        )}
      </form>
    </section>
  );
}
