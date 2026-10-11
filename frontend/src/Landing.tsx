import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { navigate } from './App';
import { ApiError, api } from './api';
import { defaultSeason, todayLocal } from './dates';
import { t, tError } from './i18n';

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
      <section className="card">
        <h1>{t('shareTitle')}</h1>
        <p className="warn">{t('shareWarn')}</p>
        <input readOnly value={url} aria-label="URL" onFocus={(e) => e.currentTarget.select()} />
        <div className="actions">
          <button
            onClick={() => {
              navigator.clipboard?.writeText(url).then(() => setCopied(true), () => {});
            }}
          >
            {copied ? t('copied') : t('copy')}
          </button>
          <button className="primary" onClick={() => navigate(`/d/${id}`)}>{t('open')}</button>
        </div>
      </section>
    );
  }

  return (
    <section className="card">
      <h1>{t('createTitle')}</h1>
      <p>{t('tagline')}</p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate();
        }}
      >
        <label>
          {t('seasonStart')}
          <input type="date" required value={start} onChange={(e) => setStart(e.target.value)} />
        </label>
        <label>
          {t('seasonEnd')}
          <input type="date" required value={end} min={start} onChange={(e) => setEnd(e.target.value)} />
        </label>
        <button className="primary" disabled={create.isPending}>{t('create')}</button>
        {create.error && (
          <p role="alert" className="error">
            {tError(create.error instanceof ApiError ? create.error.code : 'internal')}
          </p>
        )}
      </form>
    </section>
  );
}
