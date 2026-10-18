import { describe, expect, it } from 'vitest';
import './setup';
import type { Lang } from '../src/engine/ir';
import { EXAMPLES } from '../src/examples';
import { measure } from '../src/lib/complexity';

const LANGS: Lang[] = ['c', 'cpp', 'java', 'csharp', 'python'];
const get = (id: string) => EXAMPLES.find((e) => e.id === id)!;

describe('complexity lab', () => {
  it.each(LANGS)('bubble sort makes n(n-1)/2 comparisons (%s)', async (lang) => {
    const m = await measure(get('bubble-sort'), lang, 'average');
    expect(m.map((x) => x.compares)).toEqual([28, 120, 496, 2016]);
  });
  it.each(LANGS)('binary search worst case grows like log n (%s)', async (lang) => {
    const m = await measure(get('binary-search'), lang, 'worst');
    expect(m.length).toBe(4);
    expect(m[3].compares).toBeLessThan(30);
  });
  it.each(LANGS)('merge sort stays well under n² (%s)', async (lang) => {
    const m = await measure(get('merge-sort'), lang, 'worst');
    expect(m.length).toBe(4);
    expect(m[3].compares).toBeLessThan(64 * 7);
  });
});
