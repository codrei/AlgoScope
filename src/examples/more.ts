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
import gcd_c from './code/gcd.c?raw';
import gcd_cpp from './code/gcd.cpp?raw';
import gcd_java from './code/gcd.java?raw';
import gcd_csharp from './code/gcd.cs?raw';
import gcd_python from './code/gcd.py?raw';
import growth_rates_c from './code/growth-rates.c?raw';
import growth_rates_cpp from './code/growth-rates.cpp?raw';
import growth_rates_java from './code/growth-rates.java?raw';
import growth_rates_csharp from './code/growth-rates.cs?raw';
import growth_rates_python from './code/growth-rates.py?raw';
import fast_power_c from './code/fast-power.c?raw';
import fast_power_cpp from './code/fast-power.cpp?raw';
import fast_power_java from './code/fast-power.java?raw';
import fast_power_csharp from './code/fast-power.cs?raw';
import fast_power_python from './code/fast-power.py?raw';
import array_operations_c from './code/array-operations.c?raw';
import array_operations_cpp from './code/array-operations.cpp?raw';
import array_operations_java from './code/array-operations.java?raw';
import array_operations_csharp from './code/array-operations.cs?raw';
import array_operations_python from './code/array-operations.py?raw';
import doubly_linked_list_c from './code/doubly-linked-list.c?raw';
import doubly_linked_list_cpp from './code/doubly-linked-list.cpp?raw';
import doubly_linked_list_java from './code/doubly-linked-list.java?raw';
import doubly_linked_list_csharp from './code/doubly-linked-list.cs?raw';
import doubly_linked_list_python from './code/doubly-linked-list.py?raw';
import infix_to_postfix_c from './code/infix-to-postfix.c?raw';
import infix_to_postfix_cpp from './code/infix-to-postfix.cpp?raw';
import infix_to_postfix_java from './code/infix-to-postfix.java?raw';
import infix_to_postfix_csharp from './code/infix-to-postfix.cs?raw';
import infix_to_postfix_python from './code/infix-to-postfix.py?raw';
import tree_traversals_c from './code/tree-traversals.c?raw';
import tree_traversals_cpp from './code/tree-traversals.cpp?raw';
import tree_traversals_java from './code/tree-traversals.java?raw';
import tree_traversals_csharp from './code/tree-traversals.cs?raw';
import tree_traversals_python from './code/tree-traversals.py?raw';
import min_heap_c from './code/min-heap.c?raw';
import min_heap_cpp from './code/min-heap.cpp?raw';
import min_heap_java from './code/min-heap.java?raw';
import min_heap_csharp from './code/min-heap.cs?raw';
import min_heap_python from './code/min-heap.py?raw';
import coin_change_dp_c from './code/coin-change-dp.c?raw';
import coin_change_dp_cpp from './code/coin-change-dp.cpp?raw';
import coin_change_dp_java from './code/coin-change-dp.java?raw';
import coin_change_dp_csharp from './code/coin-change-dp.cs?raw';
import coin_change_dp_python from './code/coin-change-dp.py?raw';
import kruskal_mst_c from './code/kruskal-mst.c?raw';
import kruskal_mst_cpp from './code/kruskal-mst.cpp?raw';
import kruskal_mst_java from './code/kruskal-mst.java?raw';
import kruskal_mst_csharp from './code/kruskal-mst.cs?raw';
import kruskal_mst_python from './code/kruskal-mst.py?raw';
import fractional_knapsack_c from './code/fractional-knapsack.c?raw';
import fractional_knapsack_cpp from './code/fractional-knapsack.cpp?raw';
import fractional_knapsack_java from './code/fractional-knapsack.java?raw';
import fractional_knapsack_csharp from './code/fractional-knapsack.cs?raw';
import fractional_knapsack_python from './code/fractional-knapsack.py?raw';
import permutations_c from './code/permutations.c?raw';
import permutations_cpp from './code/permutations.cpp?raw';
import permutations_java from './code/permutations.java?raw';
import permutations_csharp from './code/permutations.cs?raw';
import permutations_python from './code/permutations.py?raw';
import tsp_brute_force_c from './code/tsp-brute-force.c?raw';
import tsp_brute_force_cpp from './code/tsp-brute-force.cpp?raw';
import tsp_brute_force_java from './code/tsp-brute-force.java?raw';
import tsp_brute_force_csharp from './code/tsp-brute-force.cs?raw';
import tsp_brute_force_python from './code/tsp-brute-force.py?raw';
import subset_sum_c from './code/subset-sum.c?raw';
import subset_sum_cpp from './code/subset-sum.cpp?raw';
import subset_sum_java from './code/subset-sum.java?raw';
import subset_sum_csharp from './code/subset-sum.cs?raw';
import subset_sum_python from './code/subset-sum.py?raw';

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

export const gcd: Example = {
  id: "gcd",
  title: "Euclid's GCD",
  topic: "Algorithm Analysis",
  description: "One of the oldest algorithms: gcd(a, b) = gcd(b, a % b), repeated until the remainder is 0. Each line of output is one division step.",
  time: "O(log min(a, b))",
  space: "O(1)",
  notes: "The numbers shrink at least by half every two steps, so very few steps are needed even for huge numbers.",
  output: "252 = 2 x 105 + 42\n105 = 2 x 42 + 21\n42 = 2 x 21 + 0\nGCD = 21\n",
  code: { c: gcd_c, cpp: gcd_cpp, java: gcd_java, csharp: gcd_csharp, python: gcd_python },
};

export const growthRates: Example = {
  id: "growth-rates",
  title: "Growth Rates (Counting Steps)",
  topic: "Algorithm Analysis",
  description: "Four functions whose loops run 1, log n, n and n² times. Doubling n adds 1 step to O(log n), doubles O(n) and quadruples O(n²).",
  time: "O(n²)",
  space: "O(1)",
  notes: "This is how Big-O is found: count how many times the innermost statement runs as n grows.",
  output: "n = 4: O(1) = 1, O(log n) = 2, O(n) = 4, O(n^2) = 16\nn = 8: O(1) = 1, O(log n) = 3, O(n) = 8, O(n^2) = 64\nn = 16: O(1) = 1, O(log n) = 4, O(n) = 16, O(n^2) = 256\n",
  code: { c: growth_rates_c, cpp: growth_rates_cpp, java: growth_rates_java, csharp: growth_rates_csharp, python: growth_rates_python },
};

export const fastPower: Example = {
  id: "fast-power",
  title: "Fast Power (Divide and Conquer)",
  topic: "Recursion",
  description: "Computes xⁿ by squaring x^(n/2), so 2^10 needs only 5 calls instead of 10 multiplications.",
  time: "O(log n)",
  space: "O(log n)",
  notes: "T(n) = T(n/2) + O(1), so O(log n). The naive loop is O(n).",
  output: "2^10 = 1024\n3^5 = 243\n",
  code: { c: fast_power_c, cpp: fast_power_cpp, java: fast_power_java, csharp: fast_power_csharp, python: fast_power_python },
};

export const arrayOperations: Example = {
  id: "array-operations",
  title: "Array Insert and Delete",
  topic: "Data Structures",
  description: "Inserting at a position shifts the later elements one place right; deleting shifts them one place left.",
  time: "O(n)",
  space: "O(1)",
  notes: "Reading arr[i] is O(1), but insert and delete must shift up to n elements.",
  output: "10 20 30 40 50 \n10 15 20 30 40 50 \n10 15 20 40 50 \n",
  code: { c: array_operations_c, cpp: array_operations_cpp, java: array_operations_java, csharp: array_operations_csharp, python: array_operations_python },
};

export const doublyLinkedList: Example = {
  id: "doubly-linked-list",
  title: "Doubly Linked List",
  topic: "Data Structures",
  description: "Each node points to both its next and previous node, so the list can be walked forward and backward. Deleting relinks both neighbors.",
  time: "O(n)",
  space: "O(n)",
  notes: "Insert at the end is O(1) with a tail pointer; finding a value is O(n).",
  output: "Forward: 10 30 40\nBackward: 40 30 10\n",
  code: { c: doubly_linked_list_c, cpp: doubly_linked_list_cpp, java: doubly_linked_list_java, csharp: doubly_linked_list_csharp, python: doubly_linked_list_python },
};

export const infixToPostfix: Example = {
  id: "infix-to-postfix",
  title: "Infix to Postfix (Stack)",
  topic: "Data Structures",
  description: "Converts A+B*(C-D)/E to postfix with an operator stack: operands go straight out, operators wait on the stack until a lower-precedence operator or a ) arrives.",
  time: "O(n)",
  space: "O(n)",
  notes: "Every character is pushed and popped at most once.",
  output: "Infix: A+B*(C-D)/E\nPostfix: ABCD-*E/+\n",
  code: { c: infix_to_postfix_c, cpp: infix_to_postfix_cpp, java: infix_to_postfix_java, csharp: infix_to_postfix_csharp, python: infix_to_postfix_python },
};

export const treeTraversals: Example = {
  id: "tree-traversals",
  title: "Tree Traversals",
  topic: "Trees & Heaps",
  description: "The four ways to visit a binary tree: preorder (node, left, right), inorder (left, node, right), postorder (left, right, node) and level order (row by row with a queue).",
  time: "O(n)",
  space: "O(h)",
  notes: "Each node is visited once. h is the height of the tree (the recursion depth).",
  output: "Preorder: 1 2 4 5 3 6\nInorder: 4 2 5 1 3 6\nPostorder: 4 5 2 6 3 1\nLevel order: 1 2 3 4 5 6\n",
  code: { c: tree_traversals_c, cpp: tree_traversals_cpp, java: tree_traversals_java, csharp: tree_traversals_csharp, python: tree_traversals_python },
};

export const minHeap: Example = {
  id: "min-heap",
  title: "Min-Heap (Priority Queue)",
  topic: "Trees & Heaps",
  description: "A priority queue stored in an array: insert lets the new value climb up past bigger parents; extract-min moves the last value to the root and lets it sink.",
  time: "O(log n)",
  space: "O(n)",
  notes: "Insert and extract-min are O(log n) because the tree height is log n. Reading the minimum is O(1).",
  output: "Extracted: 1 2 3\n",
  code: { c: min_heap_c, cpp: min_heap_cpp, java: min_heap_java, csharp: min_heap_csharp, python: min_heap_python },
};

export const coinChangeDp: Example = {
  id: "coin-change-dp",
  title: "Coin Change (Dynamic Programming)",
  topic: "Dynamic Programming",
  description: "Finds the fewest coins for every amount from 1 up to 6 with coins 1, 3 and 4. Greedy would pick 4 + 1 + 1 (3 coins); DP finds 3 + 3 (2 coins).",
  time: "O(amount × coins)",
  space: "O(amount)",
  notes: "Compare with Coin Change (Greedy): the greedy choice is not always optimal.",
  output: "Fewest coins for 6: 2\n",
  code: { c: coin_change_dp_c, cpp: coin_change_dp_cpp, java: coin_change_dp_java, csharp: coin_change_dp_csharp, python: coin_change_dp_python },
};

export const kruskalMst: Example = {
  id: "kruskal-mst",
  title: "Kruskal's Minimum Spanning Tree",
  topic: "Graphs",
  description: "Takes the edges from cheapest to most expensive and keeps an edge only if it joins two separate groups (union-find), so no cycle is formed.",
  time: "O(E log E)",
  space: "O(V)",
  notes: "The sorting of the edges dominates. Same graph as the Prim example, same total weight 16.",
  output: "Edge 0 - 1 weight 2\nEdge 1 - 2 weight 3\nEdge 1 - 4 weight 5\nEdge 0 - 3 weight 6\nTotal weight: 16\n",
  code: { c: kruskal_mst_c, cpp: kruskal_mst_cpp, java: kruskal_mst_java, csharp: kruskal_mst_csharp, python: kruskal_mst_python },
};

export const fractionalKnapsack: Example = {
  id: "fractional-knapsack",
  title: "Fractional Knapsack (Greedy)",
  topic: "Greedy & Backtracking",
  description: "Fills a bag of capacity 50 with the items worth the most per kg first, taking a fraction of the last item.",
  time: "O(n log n)",
  space: "O(1)",
  notes: "O(n) here because the items are already sorted. Greedy is optimal for the fractional version, but not for 0/1 knapsack (see Dynamic Programming).",
  output: "Maximum value: 240.00\n",
  code: { c: fractional_knapsack_c, cpp: fractional_knapsack_cpp, java: fractional_knapsack_java, csharp: fractional_knapsack_csharp, python: fractional_knapsack_python },
};

export const permutations: Example = {
  id: "permutations",
  title: "Permutations (Backtracking)",
  topic: "Greedy & Backtracking",
  description: "Lists every order of A, B, C: choose a letter for the first position, arrange the rest, then swap back (backtrack).",
  time: "O(n · n!)",
  space: "O(n)",
  notes: "3 letters give 3! = 6 orders; 10 letters already give 3,628,800.",
  output: "ABC\nACB\nBAC\nBCA\nCBA\nCAB\n",
  code: { c: permutations_c, cpp: permutations_cpp, java: permutations_java, csharp: permutations_csharp, python: permutations_python },
};

export const tspBruteForce: Example = {
  id: "tsp-brute-force",
  title: "Travelling Salesman (Brute Force)",
  topic: "Hard Problems (NP)",
  description: "Finds the shortest round trip through 4 cities by trying every order. TSP is NP-hard: no known algorithm is fast for large inputs.",
  time: "O(n!)",
  space: "O(n)",
  notes: "4 cities: 6 routes. 10 cities: 362,880 routes. 20 cities: about 1.2 × 10¹⁷ routes.",
  output: "Routes checked: 6\nShortest tour: 80\n",
  code: { c: tsp_brute_force_c, cpp: tsp_brute_force_cpp, java: tsp_brute_force_java, csharp: tsp_brute_force_csharp, python: tsp_brute_force_python },
};

export const subsetSum: Example = {
  id: "subset-sum",
  title: "Subset Sum (Brute Force)",
  topic: "Hard Problems (NP)",
  description: "Is there a subset of {3, 34, 4, 12, 5, 2} that adds up to 9? Checking a given answer is fast, but finding one this way means trying all 2ⁿ subsets.",
  time: "O(2ⁿ · n)",
  space: "O(1)",
  notes: "Subset Sum is NP-complete: a proposed answer can be checked in polynomial time, but no polynomial-time algorithm to find one is known.",
  output: "Found: 4 5\nFound: 3 4 2\nSubsets checked: 64\n",
  code: { c: subset_sum_c, cpp: subset_sum_cpp, java: subset_sum_java, csharp: subset_sum_csharp, python: subset_sum_python },
};
