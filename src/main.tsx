import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(<App />);
console.log("VITE SUPABASE URL PRESENT:", Boolean(import.meta.env.VITE_SUPABASE_URL));
console.log("VITE SUPABASE KEY PRESENT:", Boolean(import.meta.env.VITE_SUPABASE_ANON_KEY));
