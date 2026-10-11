import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { api, errCode, type Person } from '../lib/api';
import { t, tError } from '../lib/i18n';
import { Button, card, errorText, Field } from './ui';

interface Props {
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

export function PersonCard({
  docId,
  person,
  mine,
  readOnly,
  min,
  max,
  format,
  onChange,
  confirmEdit,
}: Props) {
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
    <li className={card(mine)}>
      <h2 className="mb-2 text-[1.1rem] font-bold">
        {person.name} {mine && <small className="font-normal">({t('mine')})</small>}
      </h2>
      <ul>
        {person.vacations.map((v) => (
          <li key={v.id} className="py-[.15rem]">
            {v.start === v.end ? format(v.start) : `${format(v.start)} – ${format(v.end)}`}
            {!readOnly && (
              <Button variant="link" onClick={() => confirmEdit() && delVac.mutate(v.id)}>
                {t('remove')}
              </Button>
            )}
          </li>
        ))}
      </ul>
      {!readOnly && (
        <>
          <form
            className="flex flex-wrap items-end gap-3 [&_label]:mb-0"
            onSubmit={(e) => {
              e.preventDefault();
              if (confirmEdit()) add.mutate();
            }}
          >
            <Field label={t('from')}>
              <input
                type="date"
                required
                min={min}
                max={max}
                value={from}
                onChange={(e) => {
                  add.reset();
                  setFrom(e.target.value);
                  if (!to || to < e.target.value) setTo(e.target.value);
                }}
              />
            </Field>
            <Field label={t('to')}>
              <input
                type="date"
                min={from || min}
                max={max}
                value={to}
                onChange={(e) => {
                  add.reset();
                  setTo(e.target.value);
                }}
              />
            </Field>
            <Button disabled={add.isPending}>{t('addRange')}</Button>
          </form>
          <Button variant="danger" onClick={() => confirmEdit() && delPerson.mutate()}>
            {t('removePerson')}
          </Button>
        </>
      )}
      {error && (
        <p role="alert" className={errorText}>
          {tError(errCode(error))}
        </p>
      )}
    </li>
  );
}
