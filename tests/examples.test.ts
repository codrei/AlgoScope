import { describe, expect, it } from 'vitest';
import './setup';
import { runCode } from '../src/engine';
import type { Lang } from '../src/engine/ir';
import { EXAMPLES } from '../src/examples';

const LANGS: Lang[] = ['c', 'cpp', 'java', 'csharp', 'python'];

describe.each(EXAMPLES.map((e) => [e.title, e] as const))('%s', (_title, ex) => {
  it.each(LANGS.filter((l) => ex.code[l] !== undefined))('%s', async (lang) => {
    const r = await runCode(lang, ex.code[lang]!, { stdin: ex.stdin, maxSteps: 20000 });
    expect(r.compileError).toBeUndefined();
    expect(r.trace!.error).toBeUndefined();
    expect(r.trace!.truncated).toBeFalsy();
    if (ex.id === 'lesson-smolmaze') expect(r.trace!.steps.at(-1)!.screen!.join('\n')).toContain('Congrats, you found the secret door!!!');
    else expect(r.trace!.stdout).toBe(ex.output);
  });
});
