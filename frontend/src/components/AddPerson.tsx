import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { api, errCode, type Person } from '../lib/api';
import { t, tError } from '../lib/i18n';
import { MAX_NAME_CHARS, nameError } from '../lib/validation';
import { Button, card, errorText, Field, hintText } from './ui';

export function AddPerson({ docId, onAdded }: { docId: string; onAdded: (p: Person) => void }) {
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
      className={card()}
      onSubmit={(e) => {
        e.preventDefault();
        if (!nameError(name)) add.mutate();
      }}
    >
      <h2 className="mb-2 text-[1.1rem] font-bold">{t('addPerson')}</h2>
      <Field label={t('nameLabel')}>
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
      </Field>
      <p id="name-hint" className={hintText}>
        {t('nameHint')}
      </p>
      {local && local !== 'name_empty' && <p className={errorText}>{tError(local)}</p>}
      {add.error && (
        <p role="alert" className={errorText}>
          {tError(errCode(add.error))}
        </p>
      )}
      <Button variant="primary" disabled={!!nameError(name) || add.isPending}>
        {t('add')}
      </Button>
    </form>
  );
}
