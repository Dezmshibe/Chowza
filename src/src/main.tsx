import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const rootElement = document.getElementById('root')!;

// The SSR shell intentionally contains different markup from the
// interactive client application. Mount the client instead of hydrating
// that shell so React does not produce hydration-mismatch errors.
// The server-rendered HTML is still present for SEO and is replaced by
// the interactive app immediately on the client.
createRoot(rootElement).render(<App />);

console.log(
  "VITE SUPABASE URL PRESENT:",
  Boolean(import.meta.env.VITE_SUPABASE_URL)
);

console.log(
  "VITE SUPABASE KEY PRESENT:",
  Boolean(import.meta.env.VITE_SUPABASE_ANON_KEY)
);