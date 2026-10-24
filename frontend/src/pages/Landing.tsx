import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { Button, card, errorText } from '../components/ui';
import { api, errCode } from '../lib/api';
import { t, tError } from '../lib/i18n';
import { navigate } from '../lib/navigate';

export function Landing() {
  const [copied, setCopied] = useState(false);

  const create = useMutation({ mutationFn: () => api.createDoc() });
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

  const steps = [
    [t('step1Title'), t('step1')],
    [t('step2Title'), t('step2')],
    [t('step3Title'), t('step3')],
  ];

  return (
    <>
      <section className="py-8">
        <h1 className="mb-3 text-3xl font-bold leading-tight sm:text-4xl">{t('heroTitle')}</h1>
        <p className="mb-6 max-w-[40rem] text-lg text-muted">{t('tagline')}</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate();
          }}
        >
          <Button variant="primary" className="px-6 py-3 text-lg" disabled={create.isPending}>
            {t('create')}
          </Button>
          {create.error && (
            <p role="alert" className={errorText}>
              {tError(errCode(create.error))}
            </p>
          )}
        </form>
      </section>

      <section aria-labelledby="how-title">
        <h2 id="how-title" className="mb-2 text-xl font-bold">
          {t('howTitle')}
        </h2>
        <ol className="grid gap-4 sm:grid-cols-3">
          {steps.map(([title, text], i) => (
            <li key={title} className={`${card()} my-0`}>
              <span
                aria-hidden="true"
                className="mb-2 flex size-8 items-center justify-center rounded-full bg-accent font-bold text-accent-fg"
              >
                {i + 1}
              </span>
              <h3 className="mb-1 font-bold">{title}</h3>
              <p className="text-muted">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      <ul className="mt-6 flex flex-col gap-2">
        {[t('featNoSignup'), t('featOverlap'), t('featPrivacy')].map((f) => (
          <li key={f} className="flex gap-2">
            <span aria-hidden="true" className="font-bold text-accent">
              ✓
            </span>
            {f}
          </li>
        ))}
      </ul>
    </>
  );
}
