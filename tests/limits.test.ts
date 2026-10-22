// A class of 20+ students will try programs that are far too big to animate. Each one must end quickly
// with a clear message, never freeze or crash the browser tab (each step keeps a copy of the data).
import { describe, expect, it } from 'vitest';
import './setup';
import { runCode } from '../src/engine';
import type { Lang } from '../src/engine/ir';

async function run(lang: Lang, code: string) {
  const t0 = performance.now();
  const r = await runCode(lang, code, { stdin: '' });
  return { r, t: r.trace!, ms: performance.now() - t0 };
}

describe('programs too big to animate stop quickly with a clear message', () => {
  it.each([
    ['python', 'x = [0] * 10**9\nprint(len(x))\n', /list of 1,000,000,000 items is too large/],
    ['python', 's = "a" * 10**9\n', /string of 1,000,000,000 characters is too long/],
    ['c', '#include <stdlib.h>\nint main() { int *p = malloc(sizeof(int) * 1000000000); p[0] = 1; return 0; }\n', /malloc of 1,000,000,000 items is too large/],
    ['csharp', 'class P { static void Main() { int[,] g = new int[5000, 5000]; g[1,1] = 2; } }\n', /array of 25,000,000 values is too large/],
    ['cpp', '#include <vector>\nusing namespace std;\nint main() { vector<vector<int>> g(5000, vector<int>(5000)); return 0; }\n', /vector of 25,000,000 values is too large/],
    ['java', 'public class Main { public static void main(String[] a) { int[] x = new int[2000000000]; } }\n', /array of 2,000,000,000 values is too large/],
  ] as [Lang, string, RegExp][])('%s: one huge allocation is an error right away', async (lang, code, msg) => {
    const { t, ms } = await run(lang, code);
    expect(t.error?.msg).toMatch(msg);
    expect(ms).toBeLessThan(2000);
  });

  it.each([
    ['python', 's = "ab"\nwhile True:\n    s = s + s\n'],
    ['cpp', '#include <string>\nusing namespace std;\nint main() { string s = "ab"; while (true) s += s; }\n'],
    ['python', 'a = [1]\nfor i in range(100):\n    a = a + a\n'],
    ['c', '#include <stdio.h>\nint main() { int a[20000]; for (int i = 0; i < 20000; i++) a[i] = i; return 0; }\n'],
    ['python', 'g = [[0] * 3000 for _ in range(3000)]\n'],
  ] as [Lang, string][])('%s: data that keeps growing stops the run at a safe size', async (lang, code) => {
    const { t, ms } = await run(lang, code);
    expect(t.truncated).toBe(true);
    expect(t.truncatedBy).toBe('size');
    expect(t.error).toBeUndefined();
    expect(ms).toBeLessThan(5000);
  });

  it('a classroom-sized program is not affected: a C stack with MAX 1000 and 900 pushes runs to the end', async () => {
    const { t } = await run('c', '#include <stdio.h>\n#define MAX 1000\nint st[MAX]; int top = -1;\nvoid push(int x) { st[++top] = x; }\nint main() { for (int i = 0; i < 900; i++) push(i); printf("%d", top); return 0; }\n');
    expect(t.truncated).toBeFalsy();
    expect(t.stdout).toBe('899');
  });

  it('a variable holding a very long string shows only its start', async () => {
    const { t } = await run('python', 's = "ab" * 400000\nn = len(s)\n');
    const v = t.steps.at(-1)!.frames[0].vars.find(([name]) => name === 's')![1];
    expect(v.t === 'p' && v.s.length).toBeLessThan(320);
  });
});
