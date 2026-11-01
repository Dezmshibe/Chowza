import { hydrateRoot, createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const rootElement = document.getElementById('root')!;

const isServerRendered = Boolean(
  (window as Window & { __CHOWZA_SSR__?: boolean }).__CHOWZA_SSR__
);

if (isServerRendered) {
  hydrateRoot(rootElement, <App />);
} else {
  createRoot(rootElement).render(<App />);
}

console.log(
  "VITE SUPABASE URL PRESENT:",
  Boolean(import.meta.env.VITE_SUPABASE_URL)
);

console.log(
  "VITE SUPABASE KEY PRESENT:",
  Boolean(import.meta.env.VITE_SUPABASE_ANON_KEY)
);