import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { navigate } from './App';
import { ApiError, type Person, api } from './api';
import { Timeline } from './Timeline';
import { lang, t, tError } from './i18n';
import { MAX_NAME_CHARS, nameError } from './validation';

const storageKey = (id: string) => `lomalista:mine:${id}`;

function loadMine(id: string): Set<number> {
  try {
    return new Set(JSON.parse(localStorage.getItem(storageKey(id)) ?? '[]'));
  } catch {
    return new Set();
  }
}

function saveMine(id: string, mine: Set<number>) {
  try {
    localStorage.setItem(storageKey(id), JSON.stringify([...mine]));
  } catch {
    /* storage unavailable: the "mine" highlight is a convenience only */
  }
}

function errCode(e: unknown): string {
  return e instanceof ApiError ? e.code : 'internal';
}

export function DocPage({ id }: { id: string }) {
  const qc = useQueryClient();
  const [mine, setMine] = useState(() => loadMine(id));
  const q = useQuery({
    queryKey: ['doc', id],
    queryFn: () => api.getDoc(id),
    refetchInterval: 5000,
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ['doc', id] });

  if (q.error instanceof ApiError && q.error.status === 404) {
    return (
      <section className="card">
        <p>{t('notFound')}</p>
        <button onClick={() => navigate('/')}>{t('home')}</button>
      </section>
    );
  }
  if (!q.data) return <p>{q.error ? tError(errCode(q.error)) : t('loading')}</p>;

  const doc = q.data;
  const fmt = new Intl.DateTimeFormat(lang, { dateStyle: 'medium', timeZone: 'UTC' });
  const d = (s: string) => fmt.format(new Date(`${s}T00:00:00Z`));
  const readOnly = doc.archived;

  const confirmOthers = (pid: number) => mine.has(pid) || window.confirm(t('confirmOthers'));

  return (
    <>
      <h1>
        {d(doc.season_start)} – {d(doc.season_end)}
      </h1>
      {readOnly && <p className="banner">{t('archivedBanner')}</p>}
      <Timeline doc={doc} mine={mine} />

      {doc.people.length === 0 && <p>{t('noPeople')}</p>}
      <ul className="people">
        {doc.people.map((p) => (
          <PersonCard
            key={p.id}
            docId={id}
            person={p}
            mine={mine.has(p.id)}
            readOnly={readOnly}
            min={doc.season_start}
            max={doc.season_end}
            format={d}
            onChange={refresh}
            confirmEdit={() => confirmOthers(p.id)}
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
    </>
  );
}

function AddPerson({ docId, onAdded }: { docId: string; onAdded: (p: Person) => void }) {
  const [name, setName] = useState('');
  const add = useMutation({
    mutationFn: () => api.addPerson(docId, name),
    onSuccess: (p) => {
      setName('');
      onAdded(p);
    },
  });
  const local = name === '' ? null : nameError(name);
  return (
    <form
      className="card"
      onSubmit={(e) => {
        e.preventDefault();
        if (!nameError(name)) add.mutate();
      }}
    >
      <h2>{t('addPerson')}</h2>
      <label>
        {t('nameLabel')}
        <input
          value={name}
          maxLength={MAX_NAME_CHARS}
          autoComplete="off"
          aria-describedby="name-hint"
          onChange={(e) => {
            add.reset();
            setName(e.target.value);
          }}
        />
      </label>
      <p id="name-hint" className="hint">{t('nameHint')}</p>
      {local && local !== 'name_empty' && <p className="error">{tError(local)}</p>}
      {add.error && <p role="alert" className="error">{tError(errCode(add.error))}</p>}
      <button className="primary" disabled={!!nameError(name) || add.isPending}>{t('add')}</button>
    </form>
  );
}

interface CardProps {
  docId: string;
  person: Person;
  mine: boolean;
  readOnly: boolean;
  min: string;
  max: string;
  format: (s: string) => string;
  onChange: () => void;
  confirmEdit: () => boolean;
}

function PersonCard({ docId, person, mine, readOnly, min, max, format, onChange, confirmEdit }: CardProps) {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const add = useMutation({
    mutationFn: () => api.addVacation(docId, person.id, from, to || from),
    onSuccess: () => {
      setFrom('');
      setTo('');
      onChange();
    },
  });
  const delVac = useMutation({
    mutationFn: (vid: number) => api.deleteVacation(docId, person.id, vid),
    onSuccess: onChange,
  });
  const delPerson = useMutation({
    mutationFn: () => api.deletePerson(docId, person.id),
    onSuccess: onChange,
  });
  const error = add.error ?? delVac.error ?? delPerson.error;

  return (
    <li className={mine ? 'card mine' : 'card'}>
      <h2>
        {person.name} {mine && <small>({t('mine')})</small>}
      </h2>
      <ul className="ranges">
        {person.vacations.map((v) => (
          <li key={v.id}>
            {v.start === v.end ? format(v.start) : `${format(v.start)} – ${format(v.end)}`}
            {!readOnly && (
              <button
                className="link"
                onClick={() => confirmEdit() && delVac.mutate(v.id)}
              >
                {t('remove')}
              </button>
            )}
          </li>
        ))}
      </ul>
      {!readOnly && (
        <>
          <form
            className="inline"
            onSubmit={(e) => {
              e.preventDefault();
              if (confirmEdit()) add.mutate();
            }}
          >
            <label>
              {t('from')}
              <input type="date" required min={min} max={max} value={from}
                onChange={(e) => { add.reset(); setFrom(e.target.value); if (!to || to < e.target.value) setTo(e.target.value); }} />
            </label>
            <label>
              {t('to')}
              <input type="date" min={from || min} max={max} value={to}
                onChange={(e) => { add.reset(); setTo(e.target.value); }} />
            </label>
            <button disabled={add.isPending}>{t('addRange')}</button>
          </form>
          <button className="link danger" onClick={() => confirmEdit() && delPerson.mutate()}>
            {t('removePerson')}
          </button>
        </>
      )}
      {error && <p role="alert" className="error">{tError(errCode(error))}</p>}
    </li>
  );
}
