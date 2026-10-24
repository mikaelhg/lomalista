export interface Vacation {
  id: number;
  start: string;
  end: string;
}
export interface Person {
  id: number;
  name: string;
  vacations: Vacation[];
}
export interface Doc {
  archived: boolean;
  people: Person[];
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
  ) {
    super(code);
  }
}

async function req<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method,
    headers: body ? { 'content-type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    referrerPolicy: 'no-referrer',
  });
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data.error ?? 'internal');
  return data as T;
}

export const api = {
  createDoc: () => req<{ id: string }>('POST', '/docs'),
  getDoc: (id: string) => req<Doc>('GET', `/docs/${id}`),
  addPerson: (id: string, name: string) => req<Person>('POST', `/docs/${id}/people`, { name }),
  deletePerson: (id: string, pid: number) => req<void>('DELETE', `/docs/${id}/people/${pid}`),
  addVacation: (id: string, pid: number, start: string, end: string) =>
    req<Vacation>('POST', `/docs/${id}/people/${pid}/vacations`, { start, end }),
  deleteVacation: (id: string, pid: number, vid: number) =>
    req<void>('DELETE', `/docs/${id}/people/${pid}/vacations/${vid}`),
};

export function errCode(e: unknown): string {
  return e instanceof ApiError ? e.code : 'internal';
}
