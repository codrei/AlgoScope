// Every program in tests/corpus must print exactly what the real compiler printed
// (recorded in <file>.out by scripts/reference-outputs.sh).
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import './setup';
import { runCode } from '../src/engine';
import type { Lang } from '../src/engine/ir';

const dir = fileURLToPath(new URL('./corpus', import.meta.url));
const EXT: Record<string, Lang> = { c: 'c', cpp: 'cpp', java: 'java', cs: 'csharp', py: 'python' };

const cases: { name: string; lang: Lang; file: string; out: string; stdin?: string }[] = [];
for (const topic of readdirSync(dir)) {
  for (const f of readdirSync(join(dir, topic))) {
    const ext = f.split('.').pop()!;
    const lang = EXT[ext];
    if (!lang) continue;
    const out = join(dir, topic, `${f}.out`);
    if (!existsSync(out)) continue;
    const stdinFile = join(dir, topic, f.replace(/\.[^.]+$/, '.in'));
    cases.push({
      name: `${topic}/${f}`,
      lang,
      file: join(dir, topic, f),
      out: readFileSync(out, 'utf8'),
      stdin: existsSync(stdinFile) ? readFileSync(stdinFile, 'utf8') : undefined,
    });
  }
}

describe('matches the real compilers', () => {
  it.each(cases.map((c) => [c.name, c] as const))('%s', async (_n, c) => {
    const r = await runCode(c.lang, readFileSync(c.file, 'utf8'), { stdin: c.stdin, maxSteps: 200000 });
    expect(r.compileError, r.compileError?.msg).toBeUndefined();
    expect(r.trace!.error?.msg ?? null).toBeNull();
    expect(r.trace!.truncated ?? false).toBe(false);
    expect(r.trace!.stdout).toBe(c.out);
  });
});
