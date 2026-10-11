import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DocPage } from './DocPage';
import { Landing } from './Landing';
import { t } from './i18n';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, refetchOnWindowFocus: true } },
});

export function navigate(path: string) {
  history.pushState(null, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

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
      <main>
        <header className="site">
          <a href="/" onClick={(e) => { e.preventDefault(); navigate('/'); }}>lomalista</a>
        </header>
        {m ? <DocPage key={m[1]} id={m[1]} /> : <Landing />}
        <footer>{t('stored')}</footer>
      </main>
    </QueryClientProvider>
  );
}
