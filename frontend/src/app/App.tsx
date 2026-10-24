import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { appNav } from '../components/ui';
import { t } from '../lib/i18n';
import { DocPage } from '../pages/DocPage';
import { Landing } from '../pages/Landing';
import { Privacy } from '../pages/Privacy';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, refetchOnWindowFocus: true } },
});

export function App() {
  const [path, setPath] = useState(location.pathname);
  useEffect(() => {
    const on = () => setPath(location.pathname);
    window.addEventListener('popstate', on);
    return () => window.removeEventListener('popstate', on);
  }, []);

  const m = /^\/d\/([A-Za-z0-9_-]{1,64})\/?$/.exec(path);
  return (
    <QueryClientProvider client={queryClient}>
      <main className="mx-auto max-w-[60rem] px-4 pb-8">
        <header className="py-4 text-xl font-bold">
          <a href="/" className="text-fg no-underline" onClick={appNav}>
            lomalista
          </a>
        </header>
        {m ? <DocPage key={m[1]} id={m[1]} /> : /^\/privacy\/?$/.test(path) ? <Privacy /> : <Landing />}
        <footer className="mt-8 flex flex-wrap gap-x-4 gap-y-1 text-[.875rem] text-muted">
          <span>{t('stored')}</span>
          <a href="/privacy" className="text-muted underline" onClick={appNav}>
            {t('privacyLink')}
          </a>
        </footer>
      </main>
    </QueryClientProvider>
  );
}
