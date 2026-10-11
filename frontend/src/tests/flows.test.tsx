import { afterEach, beforeEach, describe, expect, it, rs } from '@rstest/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import type { Doc } from '../lib/api';
import { t } from '../lib/i18n';
import { DocPage } from '../pages/DocPage';
import { Landing } from '../pages/Landing';

/** Minimal in-memory stand-in for the backend API. */
function fakeApi() {
  const doc: Doc = { season_start: '2027-06-01', season_end: '2027-08-31', archived: false, people: [] };
  let next = 1;
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
  return rs.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const path = String(input).replace(/^\/api/, '');
    const method = init?.method ?? 'GET';
    const body = init?.body ? JSON.parse(String(init.body)) : {};
    if (method === 'POST' && path === '/docs') return json({ id: 'abc' });
    if (method === 'GET' && path === '/docs/abc') return json(doc);
    if (method === 'POST' && path === '/docs/abc/people') {
      const p = { id: next++, name: body.name as string, vacations: [] };
      doc.people.push(p);
      return json(p);
    }
    const vac = /^\/docs\/abc\/people\/(\d+)\/vacations$/.exec(path);
    if (method === 'POST' && vac) {
      const v = { id: next++, start: body.start as string, end: body.end as string };
      doc.people.find((p) => p.id === Number(vac[1]))?.vacations.push(v);
      return json(v);
    }
    return json({ error: 'internal' }, 500);
  });
}

function renderWithQuery(ui: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

beforeEach(() => {
  rs.stubGlobal('fetch', fakeApi());
  localStorage.clear();
});

afterEach(() => {
  rs.unstubAllGlobals();
});

describe('Landing', () => {
  it('creates a list and shows the secret link', async () => {
    renderWithQuery(<Landing />);
    await userEvent.click(screen.getByRole('button', { name: t('create') }));
    expect(await screen.findByText(t('shareTitle'))).toBeInTheDocument();
    expect(screen.getByLabelText('URL')).toHaveValue(`${location.origin}/d/abc`);
  });
});

describe('DocPage', () => {
  it('adds a person and a vacation range', async () => {
    renderWithQuery(<DocPage id="abc" />);
    expect(await screen.findByText(t('noPeople'))).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText(t('nameLabel')), 'Åsa');
    await userEvent.click(screen.getByRole('button', { name: t('add') }));
    expect(await screen.findByRole('heading', { name: /Åsa/ })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(t('from')), { target: { value: '2027-06-20' } });
    await userEvent.click(screen.getByRole('button', { name: t('addRange') }));
    expect(await screen.findByRole('button', { name: t('remove') })).toBeInTheDocument();
  });

  it('keeps the add button disabled for invalid names', async () => {
    renderWithQuery(<DocPage id="abc" />);
    await userEvent.type(await screen.findByLabelText(t('nameLabel')), 'Bob1');
    expect(screen.getByRole('button', { name: t('add') })).toBeDisabled();
  });
});
