import { bubbleSort, insertionSort, mergeSort, quickSort, selectionSort } from './sorting';
import { factorial, fibonacci, hanoi } from './recursion';
import { binarySearch, linearSearch } from './searching';
import { balancedParens, bst, linkedList, queueArray, stackArray } from './structures';
import type { Example } from './types';

export type { Example, Topic } from './types';

export const EXAMPLES: Example[] = [
  bubbleSort,
  selectionSort,
  insertionSort,
  mergeSort,
  quickSort,
  linearSearch,
  binarySearch,
  factorial,
  fibonacci,
  hanoi,
  stackArray,
  queueArray,
  balancedParens,
  linkedList,
  bst,
];
