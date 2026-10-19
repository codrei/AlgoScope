import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  // relative paths: the same build works at codrei.github.io/AlgoScope/, in a fork with another
  // name, on a school web server or from any folder served by a simple static web server
  base: './',
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
