import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Registrar Service Worker com suporte a IndexedDB e contingência offline
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('[SW] Service Worker registrado com escopo:', registration.scope);
      })
      .catch((error) => {
        console.warn('[SW] Falha ao registrar Service Worker:', error);
      });
  });
}

createRoot(document.getElementById('root')!).render(<App />);
