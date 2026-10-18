// More algorithms every DSA / Algorithms & Complexity course covers. The code lives in
// ./code so each file can be compiled as is; tests compare the output across languages.
import type { Example } from './types';

import heap_sort_c from './code/heap-sort.c?raw';
import heap_sort_cpp from './code/heap-sort.cpp?raw';
import heap_sort_java from './code/heap-sort.java?raw';
import heap_sort_csharp from './code/heap-sort.cs?raw';
import heap_sort_python from './code/heap-sort.py?raw';
import counting_sort_c from './code/counting-sort.c?raw';
import counting_sort_cpp from './code/counting-sort.cpp?raw';
import counting_sort_java from './code/counting-sort.java?raw';
import counting_sort_csharp from './code/counting-sort.cs?raw';
import counting_sort_python from './code/counting-sort.py?raw';
import string_matching_c from './code/string-matching.c?raw';
import string_matching_cpp from './code/string-matching.cpp?raw';
import string_matching_java from './code/string-matching.java?raw';
import string_matching_csharp from './code/string-matching.cs?raw';
import string_matching_python from './code/string-matching.py?raw';
import hash_table_c from './code/hash-table.c?raw';
import hash_table_cpp from './code/hash-table.cpp?raw';
import hash_table_java from './code/hash-table.java?raw';
import hash_table_csharp from './code/hash-table.cs?raw';
import hash_table_python from './code/hash-table.py?raw';
import topological_sort_c from './code/topological-sort.c?raw';
import topological_sort_cpp from './code/topological-sort.cpp?raw';
import topological_sort_java from './code/topological-sort.java?raw';
import topological_sort_csharp from './code/topological-sort.cs?raw';
import topological_sort_python from './code/topological-sort.py?raw';
import prim_mst_c from './code/prim-mst.c?raw';
import prim_mst_cpp from './code/prim-mst.cpp?raw';
import prim_mst_java from './code/prim-mst.java?raw';
import prim_mst_csharp from './code/prim-mst.cs?raw';
import prim_mst_python from './code/prim-mst.py?raw';
import floyd_warshall_c from './code/floyd-warshall.c?raw';
import floyd_warshall_cpp from './code/floyd-warshall.cpp?raw';
import floyd_warshall_java from './code/floyd-warshall.java?raw';
import floyd_warshall_csharp from './code/floyd-warshall.cs?raw';
import floyd_warshall_python from './code/floyd-warshall.py?raw';
import n_queens_c from './code/n-queens.c?raw';
import n_queens_cpp from './code/n-queens.cpp?raw';
import n_queens_java from './code/n-queens.java?raw';
import n_queens_csharp from './code/n-queens.cs?raw';
import n_queens_python from './code/n-queens.py?raw';
import coin_change_c from './code/coin-change.c?raw';
import coin_change_cpp from './code/coin-change.cpp?raw';
import coin_change_java from './code/coin-change.java?raw';
import coin_change_csharp from './code/coin-change.cs?raw';
import coin_change_python from './code/coin-change.py?raw';
import activity_selection_c from './code/activity-selection.c?raw';
import activity_selection_cpp from './code/activity-selection.cpp?raw';
import activity_selection_java from './code/activity-selection.java?raw';
import activity_selection_csharp from './code/activity-selection.cs?raw';
import activity_selection_python from './code/activity-selection.py?raw';

export const heapSort: Example = {
  id: "heap-sort",
  title: "Heap Sort",
  topic: "Sorting",
  description: "Turns the array into a max-heap (every parent bigger than its children), then repeatedly moves the largest value to the end and repairs the heap. The array is also drawn as the tree it represents.",
  time: "O(n log n)",
  space: "O(1)",
  notes: "O(n log n) in the best, average and worst case.",
  output: "Sorted: 1 2 3 4 5 8\n",
  code: { c: heap_sort_c, cpp: heap_sort_cpp, java: heap_sort_java, csharp: heap_sort_csharp, python: heap_sort_python },
};

export const countingSort: Example = {
  id: "counting-sort",
  title: "Counting Sort",
  topic: "Sorting",
  description: "Counts how many times each value appears, then writes the values back in order. It never compares two elements with each other.",
  time: "O(n + k)",
  space: "O(k)",
  notes: "k is the largest value. Fast when k is small, but it only works for small non-negative integers.",
  output: "Sorted: 1 2 3 4 5 8\n",
  code: { c: counting_sort_c, cpp: counting_sort_cpp, java: counting_sort_java, csharp: counting_sort_csharp, python: counting_sort_python },
};

export const stringMatching: Example = {
  id: "string-matching",
  title: "String Matching (Brute Force)",
  topic: "Searching",
  description: "Slides the pattern over the text one position at a time and compares character by character.",
  time: "O(n·m)",
  space: "O(1)",
  notes: "n is the text length and m the pattern length. KMP and Boyer–Moore avoid re-checking characters.",
  output: "Found at index 0\nFound at index 9\nFound at index 12\n",
  code: { c: string_matching_c, cpp: string_matching_cpp, java: string_matching_java, csharp: string_matching_csharp, python: string_matching_python },
};

export const hashTable: Example = {
  id: "hash-table",
  title: "Hash Table (Linear Probing)",
  topic: "Data Structures",
  description: "Stores keys at index key % SIZE. When two keys land on the same slot (a collision), the next free slot is used.",
  time: "O(1) average",
  space: "O(n)",
  notes: "O(n) in the worst case when many keys collide.",
  output: "Table: 700 50 85 92 -1 -1 76\n85 is at index 2\n40 is at index -1\n",
  code: { c: hash_table_c, cpp: hash_table_cpp, java: hash_table_java, csharp: hash_table_csharp, python: hash_table_python },
};

export const topologicalSort: Example = {
  id: "topological-sort",
  title: "Topological Sort",
  topic: "Graphs",
  description: "Kahn's algorithm: orders the tasks of a directed acyclic graph so every edge u → v has u before v.",
  time: "O(V²)",
  space: "O(V)",
  notes: "O(V²) with an adjacency matrix; O(V + E) with adjacency lists.",
  output: "Topological order: 4 5 0 2 3 1\n",
  code: { c: topological_sort_c, cpp: topological_sort_cpp, java: topological_sort_java, csharp: topological_sort_csharp, python: topological_sort_python },
};

export const primMst: Example = {
  id: "prim-mst",
  title: "Prim's Minimum Spanning Tree",
  topic: "Graphs",
  description: "Grows a tree from vertex 0, always adding the cheapest edge that reaches a new vertex, until all vertices are connected.",
  time: "O(V²)",
  space: "O(V)",
  notes: "O(E log V) with a priority queue and adjacency lists.",
  output: "Edge 0 - 1 weight 2\nEdge 1 - 2 weight 3\nEdge 0 - 3 weight 6\nEdge 1 - 4 weight 5\nTotal weight: 16\n",
  code: { c: prim_mst_c, cpp: prim_mst_cpp, java: prim_mst_java, csharp: prim_mst_csharp, python: prim_mst_python },
};

export const floydWarshall: Example = {
  id: "floyd-warshall",
  title: "Floyd–Warshall (All-Pairs Shortest Paths)",
  topic: "Graphs",
  description: "Finds the shortest distance between every pair of vertices by allowing one more intermediate vertex k each round.",
  time: "O(V³)",
  space: "O(V\u00b2)",
  notes: "A dynamic programming algorithm: dist[i][j] is improved using the answers for k - 1.",
  output: "Shortest distances:\n0 3 5 6 \n5 0 2 3 \n3 6 0 1 \n2 5 7 0 \n",
  code: { c: floyd_warshall_c, cpp: floyd_warshall_cpp, java: floyd_warshall_java, csharp: floyd_warshall_csharp, python: floyd_warshall_python },
};

export const nQueens: Example = {
  id: "n-queens",
  title: "N-Queens (Backtracking)",
  topic: "Greedy & Backtracking",
  description: "Places 4 queens on a 4×4 board so no two attack each other. When a row has no safe column, it goes back and moves the previous queen.",
  time: "O(N!)",
  space: "O(N\u00b2)",
  notes: "Backtracking skips most of the N^N possible boards.",
  output: ". Q . . \n. . . Q \nQ . . . \n. . Q . \n",
  code: { c: n_queens_c, cpp: n_queens_cpp, java: n_queens_java, csharp: n_queens_csharp, python: n_queens_python },
};

export const coinChange: Example = {
  id: "coin-change",
  title: "Coin Change (Greedy)",
  topic: "Greedy & Backtracking",
  description: "Pays 63 using the biggest coin that still fits each time.",
  time: "O(amount)",
  space: "O(1)",
  notes: "Greedy is optimal for 25/10/5/1 coins, but not for every coin system (try coins 4, 3, 1 and amount 6). Dynamic programming always finds the best answer.",
  output: "Coins: 25 25 10 1 1 1\nTotal coins: 6\n",
  code: { c: coin_change_c, cpp: coin_change_cpp, java: coin_change_java, csharp: coin_change_csharp, python: coin_change_python },
};

export const activitySelection: Example = {
  id: "activity-selection",
  title: "Activity Selection (Greedy)",
  topic: "Greedy & Backtracking",
  description: "Chooses the most activities that do not overlap by always taking the one that finishes first.",
  time: "O(n)",
  space: "O(1)",
  notes: "O(n log n) if the activities still need to be sorted by finish time.",
  output: "Selected activities: 0 1 3 4\n",
  code: { c: activity_selection_c, cpp: activity_selection_cpp, java: activity_selection_java, csharp: activity_selection_csharp, python: activity_selection_python },
};
