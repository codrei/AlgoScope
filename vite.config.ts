import { readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

/** every file in a folder, as paths relative to it */
function filesIn(dir: string, root = dir): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((d) =>
    d.isDirectory() ? filesIn(join(dir, d.name), root) : [relative(root, join(dir, d.name)).split('\\').join('/')],
  );
}

/**
 * precache.json: every file the app needs, so it can be saved for use without internet (see main.tsx).
 * The page itself is listed as "./"; the service worker and the install screenshots are left out.
 */
function precacheList(): Plugin {
  return {
    name: 'precache-list',
    apply: 'build',
    generateBundle(_, bundle) {
      const files = [
        './',
        ...Object.keys(bundle).filter((f) => f !== 'index.html'),
        ...filesIn('public').filter((f) => f !== 'sw.js' && !f.startsWith('screenshots/')),
      ];
      this.emitFile({ type: 'asset', fileName: 'precache.json', source: JSON.stringify(files) });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  // relative paths: the same build works at codrei.github.io/AlgoScope/, in a fork with another
  // name, on a school web server or from any folder served by a simple static web server
  base: './',
  plugins: [react(), precacheList()],
  resolve: {
    alias: {
      'monaco-esm': fileURLToPath(new URL('./node_modules/monaco-editor/esm/vs', import.meta.url)),
    },
  },
  build: {
    chunkSizeWarningLimit: 4000,
  },
});
