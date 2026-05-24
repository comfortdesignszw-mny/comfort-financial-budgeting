import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Register Service Worker for seamless offline capability and fast caching
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('[Comfort App] Service Worker registered successfully scope:', registration.scope);
      })
      .catch((error) => {
        console.error('[Comfort App] Service Worker registration failed:', error);
      });
  });
}
