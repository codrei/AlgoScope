import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/inter';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/700.css';
import './index.css';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Offline support (production only): cache the app, then fetch every language's
// grammar in the background so all five languages work without internet later.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  const base = import.meta.env.BASE_URL;
  navigator.serviceWorker
    .register(`${base}sw.js`)
    .then(() => {
      window.setTimeout(() => {
        for (const g of ['tree-sitter', 'tree-sitter-c', 'tree-sitter-cpp', 'tree-sitter-java', 'tree-sitter-c_sharp', 'tree-sitter-python']) {
          fetch(`${base}grammars/${g}.wasm`).catch(() => undefined);
        }
      }, 8000);
    })
    .catch(() => undefined);
}
