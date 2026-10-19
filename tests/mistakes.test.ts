// Common student mistakes must end with a clear message on the right line, never a crash.
import { describe, expect, it } from 'vitest';
import './setup';
import { runCode } from '../src/engine';
import type { Lang } from '../src/engine/ir';

const runtime: [string, Lang, string, RegExp, number][] = [
  ['array index out of bounds (C)', 'c', '#include <stdio.h>\nint main(){\n  int a[5] = {1,2,3,4,5};\n  printf("%d", a[7]);\n  return 0;\n}\n', /index 7 is out of bounds: a has 5 elements/, 4],
  ['array index out of bounds (Java)', 'java', 'public class Main {\n  public static void main(String[] args) {\n    int[] x = new int[3];\n    x[5] = 1;\n  }\n}\n', /index 5 is out of bounds/, 4],
  ['division by zero (Python)', 'python', 'a = 5\nb = 0\nprint(a / b)\n', /division by zero/, 3],
  ['null pointer (C++)', 'cpp', '#include <iostream>\nstruct Node { int data; Node* next; };\nint main() {\n  Node* p = nullptr;\n  std::cout << p->data;\n}\n', /p is nullptr/, 5],
  ['null reference (Java)', 'java', 'public class Main {\n  static class N { int v; }\n  public static void main(String[] args) {\n    N n = null;\n    System.out.println(n.v);\n  }\n}\n', /n is null/, 5],
  ['missing input', 'c', '#include <stdio.h>\nint main(){\n  int n;\n  scanf("%d", &n);\n  return 0;\n}\n', /Input box/, 4],
  ['runaway recursion', 'c', 'int f(int n){ return 1 + f(n - 1); }\nint main(){ return f(5); }\n', /stack overflow. Check the base case of f\(\)/, 1],
];

describe('runtime mistakes', () => {
  it.each(runtime)('%s', async (_name, lang, code, msg, line) => {
    const r = await runCode(lang, code);
    expect(r.trace?.error?.msg).toMatch(msg);
    expect(r.trace?.error?.line).toBe(line);
  });
});

describe('syntax mistakes', () => {
  it('missing semicolon (C#)', async () => {
    const r = await runCode('csharp', 'using System;\nclass P {\n  static void Main() {\n    int x = 5\n    Console.WriteLine(x);\n  }\n}\n');
    expect(r.compileError?.msg).toMatch(/Syntax error/);
  });
  it('missing indentation (Python)', async () => {
    const r = await runCode('python', 'x = 3\nif x > 1:\nprint("big")\n');
    expect(r.compileError).toEqual({ line: 2, msg: expect.stringMatching(/indented block after "if x > 1:"/) });
  });
  it('valid one-line Python bodies are fine', async () => {
    const r = await runCode('python', 'def g(): return 5\nif True: print(g())\nclass A: pass\n');
    expect(r.trace?.stdout).toBe('5\n');
  });
});

describe('infinite loops', () => {
  it('stop at the step limit instead of freezing', async () => {
    const r = await runCode('c', 'int main(){ int i = 0; while (1) { i++; } return 0; }');
    expect(r.trace?.truncated).toBe(true);
    expect(r.trace?.steps.length).toBe(5000);
  });
});

describe('unsupported library calls name the method', () => {
  it('C# LINQ', async () => {
    const r = await runCode('csharp', 'using System; using System.Linq;\nclass P { static void Main(){ int[] a = {3,1,2}; Console.WriteLine(a.Where(x => x > 1).Count()); } }');
    expect(r.trace?.error?.msg).toBe("an array has no method 'Where'");
  });
});
