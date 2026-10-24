import { afterEach, describe, expect, it } from '@rstest/core';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../app/App';
import { t } from '../lib/i18n';
import { policies } from '../lib/privacy';

afterEach(() => history.pushState(null, '', '/'));

describe('privacy policy', () => {
  it('opens from the footer link', async () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: t('heroTitle') })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('link', { name: t('privacyLink') }));
    expect(location.pathname).toBe('/privacy');
    expect(screen.getByRole('heading', { level: 1, name: policies.en.title })).toBeInTheDocument();
  });

  it('has the same sections in every language', () => {
    const counts = Object.values(policies).map((p) => p.sections.map((s) => s.body.length));
    for (const c of counts) expect(c).toEqual(counts[0]);
  });
});
