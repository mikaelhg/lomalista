import { afterEach, beforeEach, describe, expect, it, rs } from '@rstest/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import type { Doc } from '../lib/api';
import { t } from '../lib/i18n';
import { DocPage } from '../pages/DocPage';
import { Landing } from '../pages/Landing';

/** Minimal in-memory stand-in for the backend API. */
let seed: Doc['people'] = [];

function fakeApi() {
  const doc: Doc = { archived: false, people: seed };
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

/** Opens the range calendar and picks the 15th of next month as a single-day range. */
async function pickDay() {
  const n = new Date();
  const target = new Date(n.getFullYear(), n.getMonth() + 1, 15);
  const label = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(
    target,
  );
  await userEvent.click(screen.getByRole('button', { name: /calendar/i }));
  // React Aria also renders a hidden Next button for screen readers; the first is the visible one
  await userEvent.click(screen.getAllByRole('button', { name: 'Next' })[0]);
  const day = () => screen.getByRole('button', { name: new RegExp(label) });
  await userEvent.click(day());
  await userEvent.click(day());
}

beforeEach(() => {
  seed = [];
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

    await pickDay();
    await userEvent.click(screen.getByRole('button', { name: t('addRange') }));
    expect(await screen.findByRole('button', { name: t('remove') })).toBeInTheDocument();
  });

  it('asks before changing someone added in another browser', async () => {
    seed.push({ id: 99, name: 'Erik', vacations: [] });
    renderWithQuery(<DocPage id="abc" />);
    await screen.findByRole('heading', { name: /Erik/ });

    await pickDay();
    await userEvent.click(screen.getByRole('button', { name: t('addRange') }));
    const dialog = await screen.findByRole('alertdialog');
    expect(dialog).toHaveTextContent(t('confirmOthers'));

    await userEvent.click(screen.getByRole('button', { name: t('cancel') }));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: t('remove') })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: t('addRange') }));
    await userEvent.click(await screen.findByRole('button', { name: t('proceed') }));
    expect(await screen.findByRole('button', { name: t('remove') })).toBeInTheDocument();
  });

  it('keeps the add button disabled for invalid names', async () => {
    renderWithQuery(<DocPage id="abc" />);
    await userEvent.type(await screen.findByLabelText(t('nameLabel')), 'Bob1');
    expect(screen.getByRole('button', { name: t('add') })).toBeDisabled();
  });
});
