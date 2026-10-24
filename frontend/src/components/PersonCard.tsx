import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { api, errCode, type Person } from '../lib/api';
import { t, tError } from '../lib/i18n';
import { DateRange, type Range } from './DateRange';
import { Button, card, errorText } from './ui';

interface Props {
  docId: string;
  person: Person;
  mine: boolean;
  readOnly: boolean;
  min: string;
  max: string;
  format: (s: string) => string;
  onChange: () => void;
  /** Runs `action`, asking first if this person was not created in this browser. */
  confirmEdit: (action: () => void) => void;
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
  const [range, setRange] = useState<Range | null>(null);
  const add = useMutation({
    mutationFn: (r: Range) => api.addVacation(docId, person.id, r.start, r.end),
    onSuccess: () => {
      setRange(null);
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
              <Button variant="link" onClick={() => confirmEdit(() => delVac.mutate(v.id))}>
                {t('remove')}
              </Button>
            )}
          </li>
        ))}
      </ul>
      {!readOnly && (
        <>
          <form
            className="flex flex-wrap items-end gap-3 [&>div]:mb-0"
            onSubmit={(e) => {
              e.preventDefault();
              const r = range;
              if (r) confirmEdit(() => add.mutate(r));
            }}
          >
            <DateRange
              label={t('dates')}
              required
              min={min}
              max={max}
              value={range}
              onChange={(r) => {
                add.reset();
                setRange(r);
              }}
            />
            <Button disabled={add.isPending}>{t('addRange')}</Button>
          </form>
          <Button variant="danger" onClick={() => confirmEdit(() => delPerson.mutate())}>
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
