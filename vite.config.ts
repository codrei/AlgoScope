import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  base: '/AlgoScope/',
  plugins: [react()],
  resolve: {
    alias: {
      'monaco-esm': fileURLToPath(new URL('./node_modules/monaco-editor/esm/vs', import.meta.url)),
    },
  },
  build: {
    chunkSizeWarningLimit: 4000,
  },
});
