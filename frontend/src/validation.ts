// Mirrors backend/src/validation.rs. The backend is authoritative; this is only for UX.
export const MAX_NAME_CHARS = 15;

const LETTER = /^[A-Za-zÅÄÖÆØÞÐÁÉÍÓÚÝåäöæøþðáéíóúý]$/;

export type NameError = 'name_empty' | 'name_too_long' | 'name_chars';

export function nameError(raw: string): NameError | null {
  const name = raw.trim().normalize('NFC');
  if (name === '') return 'name_empty';
  const chars = [...name];
  if (chars.length > MAX_NAME_CHARS) return 'name_too_long';
  let prevSep = true;
  for (const c of chars) {
    const sep = c === ' ' || c === '-';
    if ((sep && prevSep) || (!sep && !LETTER.test(c))) return 'name_chars';
    prevSep = sep;
  }
  return prevSep ? 'name_chars' : null;
}
