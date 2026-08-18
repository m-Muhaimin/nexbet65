import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import {ErrorBoundary} from './components/ErrorBoundary';
import {track} from './engine/analytics';
import {preloadAssets} from './engine/assetPreloader';
import {bridge} from './engine/PlatformBridge';
import './index.css';

track('session_start', { viewport: { w: window.innerWidth, h: window.innerHeight } });

// Preload processed PNG/WebP assets in background
preloadAssets();

// Notify parent platform that the game is ready (postMessage bridge)
setTimeout(() => bridge.gameReady(), 500);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
