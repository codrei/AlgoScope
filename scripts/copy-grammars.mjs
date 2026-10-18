// Copies the tree-sitter runtime and grammar .wasm files into public/grammars.
import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'public', 'grammars');
mkdirSync(out, { recursive: true });
copyFileSync(join(root, 'node_modules/web-tree-sitter/tree-sitter.wasm'), join(out, 'tree-sitter.wasm'));
for (const g of ['cpp', 'java', 'c_sharp', 'python']) {
  copyFileSync(join(root, `node_modules/tree-sitter-wasms/out/tree-sitter-${g}.wasm`), join(out, `tree-sitter-${g}.wasm`));
}
console.log('grammars copied to public/grammars');
