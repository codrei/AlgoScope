import { fileURLToPath } from 'node:url';
import { configureEngine } from '../src/engine';

const root = fileURLToPath(new URL('..', import.meta.url));
configureEngine({
  grammarPath: (name) => `${root}public/grammars/tree-sitter-${name}.wasm`,
});
