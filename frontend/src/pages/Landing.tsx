import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { Button, card, errorText, Field } from '../components/ui';
import { api, errCode } from '../lib/api';
import { defaultSeason, todayLocal } from '../lib/dates';
import { t, tError } from '../lib/i18n';
import { navigate } from '../lib/navigate';

export function Landing() {
  const def = defaultSeason(todayLocal());
  const [start, setStart] = useState(def.start);
  const [end, setEnd] = useState(def.end);
  const [copied, setCopied] = useState(false);

  const create = useMutation({ mutationFn: () => api.createDoc(start, end) });
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
          create.mutate();
        }}
      >
        <Field label={t('seasonStart')}>
          <input type="date" required value={start} onChange={(e) => setStart(e.target.value)} />
        </Field>
        <Field label={t('seasonEnd')}>
          <input type="date" required value={end} min={start} onChange={(e) => setEnd(e.target.value)} />
        </Field>
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
