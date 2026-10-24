import { getLocalTimeZone, parseDate, today } from '@internationalized/date';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { AddPerson } from '../components/AddPerson';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { PersonCard } from '../components/PersonCard';
import { Timeline } from '../components/Timeline';
import { Button, card } from '../components/ui';
import { ApiError, api, errCode } from '../lib/api';
import { dateFormat } from '../lib/dates';
import { t, tError } from '../lib/i18n';
import { loadMine, saveMine } from '../lib/mine';
import { navigate } from '../lib/navigate';

export function DocPage({ id }: { id: string }) {
  const qc = useQueryClient();
  const [mine, setMine] = useState(() => loadMine(id));
  const [pending, setPending] = useState<(() => void) | null>(null);
  const q = useQuery({
    queryKey: ['doc', id],
    queryFn: () => api.getDoc(id),
    refetchInterval: 5000,
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ['doc', id] });

  if (q.error instanceof ApiError && q.error.status === 404) {
    return (
      <section className={card()}>
        <p>{t('notFound')}</p>
        <Button onClick={() => navigate('/')}>{t('home')}</Button>
      </section>
    );
  }
  if (!q.data) return <p>{q.error ? tError(errCode(q.error)) : t('loading')}</p>;

  const doc = q.data;
  const fmt = dateFormat({ dateStyle: 'medium' });
  const d = (s: string) => fmt(parseDate(s));
  const readOnly = doc.archived;
  // Mirrors the backend's limits: no past vacations, none starting over 18 months ahead.
  const now = today(getLocalTimeZone());

  const confirmOthers = (pid: number, action: () => void) =>
    mine.has(pid) ? action() : setPending(() => action);

  return (
    <>
      <h1 className="mb-4 mt-2 text-2xl font-bold">{t('listTitle')}</h1>
      {readOnly && <p className="rounded-md bg-warn/20 p-3">{t('archivedBanner')}</p>}
      <Timeline doc={doc} mine={mine} />

      {doc.people.length === 0 && <p>{t('noPeople')}</p>}
      <ul>
        {doc.people.map((p) => (
          <PersonCard
            key={p.id}
            docId={id}
            person={p}
            mine={mine.has(p.id)}
            readOnly={readOnly}
            min={now.toString()}
            max={now.add({ months: 18 }).toString()}
            format={d}
            onChange={refresh}
            confirmEdit={(action) => confirmOthers(p.id, action)}
          />
        ))}
      </ul>

      {!readOnly && (
        <AddPerson
          docId={id}
          onAdded={(p) => {
            const next = new Set(mine).add(p.id);
            setMine(next);
            saveMine(id, next);
            refresh();
          }}
        />
      )}
      <ConfirmDialog
        message={pending ? t('confirmOthers') : null}
        onConfirm={() => {
          pending?.();
          setPending(null);
        }}
        onCancel={() => setPending(null)}
      />
    </>
  );
}
