import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { AppLockProvider } from './components/AppLockContext.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppLockProvider>
      <App />
    </AppLockProvider>
  </StrictMode>,
);

// Register Service Worker for seamless offline capability and fast caching
if ('serviceWorker' in navigator) {
  const registerSW = () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('[Comfort App] Service Worker registered successfully scope:', registration.scope);
      })
      .catch((error) => {
        console.error('[Comfort App] Service Worker registration failed:', error);
      });
  };

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    registerSW();
  } else {
    window.addEventListener('load', registerSW);
  }
}
