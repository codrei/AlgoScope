import { bubbleSort, insertionSort, mergeSort, quickSort, selectionSort } from './sorting';
import { fibDp, knapsack, lcs } from './dp';
import { bfs, dfs, dijkstra } from './graphs';
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
  fibDp,
  knapsack,
  lcs,
  bfs,
  dfs,
  dijkstra,
];
