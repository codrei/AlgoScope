// Wire Monaco to @monaco-editor/react using the local bundle (works offline, no CDN).
import { loader } from '@monaco-editor/react';
import EditorWorker from 'monaco-esm/editor/editor.worker.js?worker';
import * as monaco from './editor';

(self as unknown as { MonacoEnvironment: unknown }).MonacoEnvironment = {
  getWorker: () => new EditorWorker(),
};

loader.config({ monaco: monaco as never });

export { monaco };
