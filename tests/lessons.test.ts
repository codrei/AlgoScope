// Code the way it appears on the professor's slides: Turbo C, K&R C, curly quotes,
// Python 2, the textbook IO class, and functions without a main().
import { describe, expect, it } from 'vitest';
import './setup';
import { runCode } from '../src/engine';
import type { Lang } from '../src/engine/ir';

describe('slide-style code runs as written', () => {
  it('K&R C with curly quotes from a PDF', async () => {
    const r = await runCode('c', 'int n, i, fact = 1;\nmain(){\n  scanf (“%d”, &n);\n  for (i=1; i<=n;i++) fact=fact*i;\n  printf(“factorial is: %d”, fact);\n}\n', { stdin: '4' });
    expect(r.trace?.error).toBeUndefined();
    expect(r.trace?.stdout).toBe('factorial is: 24');
    expect(r.notices?.join(' ')).toMatch(/Curly quotes/);
  });

  it('implicit int return type on functions', async () => {
    const r = await runCode('c', '#include <stdio.h>\nfactorial(int n) {\n  if (n == 1) return 1;\n  else return n * factorial(n - 1);\n}\nmain() { printf("%d", factorial(5)); }\n');
    expect(r.trace?.stdout).toBe('120');
  });

  it('Turbo C++ headers, void main, conio and getch keys', async () => {
    const code = '#include<iostream.h>\n#include<conio.h>\nvoid main()\n{\nclrscr();\nint x = 1;\nchar ch;\nwhile (ch != 27) {\n ch = getch();\n if (ch == 77) x++;\n}\ngotoxy(3, 2); cout << "x = " << x;\n}\n';
    const r = await runCode('cpp', code, { stdin: '<right><right><left><esc>' });
    expect(r.trace?.error).toBeUndefined();
    expect(r.trace?.steps.at(-1)?.screen?.[1]).toBe('  x = 3');
  });

  it('Python 2 print statement', async () => {
    const r = await runCode('python', 'x = 3\nprint x\nprint "total", x * 2\n');
    expect(r.trace?.stdout).toBe('3\ntotal 6\n');
  });

  it('the textbook IO class in Java', async () => {
    const code = 'public class Main {\n  public static void main(String[] args) {\n    int n = IO.readInt();\n    int sum = 0;\n    for (int i = 0; i < n; i++) sum = sum + i;\n    System.out.println(sum);\n  }\n}\n';
    const r = await runCode('java', code, { stdin: '5' });
    expect(r.trace?.stdout).toBe('10\n');
  });

  it('arr.length inside a C function (as on the Week 5 slide)', async () => {
    const r = await runCode('c', '#include <stdio.h>\nint search(int arr[], int x) {\n  for (int i = 0; i < arr.length; i++) if (arr[i] == x) return i;\n  return -1;\n}\nint main() { int a[] = {4, 8, 15}; printf("%d", search(a, 15)); return 0; }\n');
    expect(r.trace?.stdout).toBe('2');
  });

  it('C++ reference variables and static_cast', async () => {
    const r = await runCode('cpp', '#include <iostream>\nusing namespace std;\nint main() {\n  string hello = "Hello";\n  string &ref = hello;\n  ref += "!";\n  cout << hello << " " << static_cast<int>(7.9);\n}\n');
    expect(r.trace?.stdout).toBe('Hello! 7');
  });
});

describe('"Add a main() for me" for slides that show only a function', () => {
  const cases: [Lang, string, string][] = [
    ['c', 'void selectionSort(int array[], int size){\n  int i, j, imin;\n  for(i = 0; i<size-1; i++) {\n    imin = i;\n    for(j = i+1; j<size; j++)\n      if(array[j] < array[imin]) imin = j;\n    int temp = array[i]; array[i] = array[imin]; array[imin] = temp;\n  }\n}\n', 'array: 1 2 3 4 5 8\n'],
    ['c', 'int bin_search (int arr[], int x, int start, int end) {\n  int mid = (start+end)/2;\n  if (arr[mid]==x) {return mid;}\n  if (start==end) { return -1;}\n  if (arr[mid] > x) { return bin_search (arr, x, start, mid-1);}\n  return bin_search (arr, x, mid+1, end);\n}\n', 'bin_search returned 3\narr: 1 2 3 4 5 8\n'],
    ['java', 'public class Sorts {\n  private static void insertionSort(int[] array) {\n    for (int i = 1; i < array.length; i++) {\n      int temp = array[i]; int j = i - 1;\n      while (j >= 0 && array[j] > temp) { array[j + 1] = array[j]; j--; }\n      array[j + 1] = temp;\n    }\n  }\n}\n', 'array: [1, 2, 3, 4, 5, 8]\n'],
    ['python', 'def binary_search(arr, target, low, high):\n    if low > high:\n        return -1\n    mid = (low + high) // 2\n    if arr[mid] == target:\n        return mid\n    elif arr[mid] < target:\n        return binary_search(arr, target, mid + 1, high)\n    return binary_search(arr, target, low, mid - 1)\n', 'binary_search returned 3\narr: 1 2 3 4 5 8\n'],
    ['csharp', 'class Algo {\n  static int Sum(int[] a, int n) {\n    int s = 0;\n    for (int i = 0; i < n; i++) s += a[i];\n    return s;\n  }\n}\n', 'Sum returned 23\na: 5 1 4 2 8 3\n'],
  ];
  it.each(cases)('%s', async (lang, snippet, out) => {
    const r = await runCode(lang, snippet);
    expect(r.suggestion).toBeDefined();
    const r2 = await runCode(lang, r.suggestion!.code);
    expect(r2.compileError).toBeUndefined();
    expect(r2.trace?.error).toBeUndefined();
    expect(r2.trace?.stdout).toBe(out);
  });
});
