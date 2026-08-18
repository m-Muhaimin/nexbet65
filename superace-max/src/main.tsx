import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import {ErrorBoundary} from './components/ErrorBoundary';
import {track} from './engine/analytics';
import {preloadAssets} from './engine/assetPreloader';
import './index.css';

track('session_start', { viewport: { w: window.innerWidth, h: window.innerHeight } });

// Preload processed PNG/WebP assets in background
preloadAssets();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
