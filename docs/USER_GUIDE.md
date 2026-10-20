# AlgoScope User Guide

**Open it:** https://codrei.github.io/AlgoScope/ (works in Chrome, Edge and Firefox; nothing to install).

AlgoScope runs a C, C++, Java, C# or Python program one line at a time and shows what each line does.
It is meant for teaching **Data Structures & Algorithms** and **Algorithms & Complexity**.

## 1. The screen

| Area | What it shows |
|---|---|
| **Top bar** | Examples menu, Complexity Lab, text size (− / +), Present mode, light/dark theme, Help |
| **Editor (left)** | Language tabs, Reset, **Run**. The line that just ran is highlighted in gold. |
| **Visualization (right)** | Algorithm name and Big-O badges, the picture of the data, the step explanation, counters, call stack and output |
| **Playback bar (bottom right)** | first / back / play-pause / forward / last, a slider to jump to any step, and the speed |

## Focus / Full detail and Key steps / Every line

Two switches control how much the class sees.

- **Focus** (default, top right of the visualization): the main picture, a blue line saying what the
  algorithm is doing (*"Pass 2 of 5: compare neighbors and push the largest unsorted value to the end."*),
  a plain-English **What just happened** sentence (*"Is arr[0] = 5 greater than arr[1] = 1? Yes, so the code
  inside the if runs."*) and the current variables. **In code terms** shows the technical version.
- **Full detail**: also Big-O badges, counters, the full call stack, helper arrays, the adjacency matrix next to the
  graph, and the recursion tree.
- **Key steps** (default, in the playback bar): stops only on compares, swaps, changes, pointer moves, calls and
  output. Bubble Sort takes 28 stops instead of 84.
- **Every line**: stops on every line, useful when tracing a loop in detail.

The explanation box stays pinned at the bottom of the panel, so it is visible even on small laptop screens.

## Following along

- **Parts bar:** above the playback controls, the run is split into the parts of the algorithm: *Pass 2 of 5* in
  Bubble Sort, *Merge [0..2]* in Merge Sort, *Build the heap* in Heap Sort, *Visit 3* in BFS, *push(10)* in a stack
  program. Click a part to jump to it, or press **Page Up** / **Page Down**. Your own code gets parts too: each
  operation called from `main` (push, pop, insert…), or each round of the main loop.
- **Idea first, code second:** in the built-in examples the big sentence explains the idea of each key moment with
  the real values, for example *"Is 8 bigger than the key 4? Yes, so 8 shifts one place right to make room"* or
  *"dp[7] = dp[6] + dp[5] = 8 + 5 = 13"*. The same step in code terms is the small grey line underneath.
- **Moving values:** a value copied to another cell slides there, and the cell it left becomes a dashed **gap**
  (no confusing duplicate like `1 5 5 2`). Insertion Sort's `key` floats above the gap until it is dropped in;
  a swap's `temp` does the same in Every line mode.
- **Built from:** when a DP cell (Knapsack, LCS, Fibonacci, Floyd–Warshall) is computed, the cells it was built from
  get a dashed outline.
- **End of the run:** the last step sums up the work (comparisons, swaps, writes, calls) and what the example's
  Big-O means when the input doubles, with a button into the Complexity Lab. When a sort finishes, the cells bounce
  once, left to right.

## On a phone or tablet

Phones (and tablets held upright) get a layout made for touch:

- **Code** and **Watch** at the top switch between writing the program and watching it run. Pressing **Run**
  (the yellow button at the bottom) switches to Watch by itself; a compile error stays in Code, where it is shown.
- **Watch** shows the picture first, then what just happened, then the line of code that ran with one line before
  and after it (tap it for the whole program). On a tablet a larger code panel shows about ten lines. Nothing is
  ever drawn on top of the picture, and the whole page scrolls as one.
- **The bar at the bottom** has Back, Play and Next, a slider, and the part of the algorithm you are in. You can
  also **swipe** the picture left for the next step and right for the step before. The **⚙** button sets the
  speed, Key steps or Every line, and Predict mode.
- **Examples** open full screen with a search box; Help and the Complexity Lab also fill the screen.
- Tablets held sideways keep the laptop layout with finger-sized controls; there the explanation sits under the
  picture. For watching on a sideways tablet, **Present** mode works well.

## Predict mode (for class discussion)

Turn on **Predict** in the playback bar. Before every comparison the animation stops and asks the class, for
example *"Is arr[1] = 1 less than arr[0] = 5?"*. Let students answer, then click **Yes** / **No** (or press **Y** / **N**).
AlgoScope shows **✓ Correct!** or **✗ Not this time** and reveals the step. Press Play or Next to continue.

## Offline use

After AlgoScope has been opened once (with internet), it keeps a copy in the browser. It opens and runs all five
languages without internet afterwards, which is useful if the classroom Wi-Fi is unreliable. Open it once before class.

## 2. Running an algorithm

1. Open **Examples** and pick an algorithm. Every example exists in all five languages, so switch
   the language tab to show the same algorithm in C, C++, Java, C# or Python.
2. Press **Run** (or **Ctrl + Enter**). The animation starts by itself.
3. Pause with **Space**, then step with **←** and **→** while you explain each line.
   **Home** / **End** jump to the first / last step.

Under **In code terms**, each step is also described technically, for example:

- `COMPARE arr[0] (5) > arr[1] (1) → true`
- `SWAP arr[0] ↔ arr[1]`
- `CALL mergeSort(arr, 0, 2)` / `RETURN 3 from fib`
- `CHECK j < n - i - 1 → false · exit loop`

## 3. What the pictures mean

| Color / mark | Meaning |
|---|---|
| Blue outline + bracket with `>` | the two values being compared |
| Red, with a hop animation | the two values that were just swapped |
| Yellow | a value that was just changed |
| Green | the value is in its final sorted place (it will not be touched again) |
| Yellow tags under cells (`i`, `j`, `mid`, `low`…) | which index each variable points to |
| Faded cells | outside the current range (`left..right`, `low..high`) |

Depending on the code, AlgoScope also draws:

- **2D arrays** as tables (DP tables fill cell by cell)
- **adjacency matrices** as a graph (visited vertices in green, current vertex ringed in gold, edge being checked highlighted, distances under each vertex)
- **linked lists and trees** as nodes with arrows, with pointer variables (`head`, `cur`, `prev`, `root`) labelled
- **stacks** as a vertical column with the top marked, **queues** with front and rear
- **hash maps / dictionaries** as key–value tables
- the **recursion tree** for recursive functions, with each call's return value

## 4. Teaching complexity

- The counters (**comparisons, swaps, function calls**) update with every step.
- **Complexity Lab** (top bar) reruns the current sorting or searching example on 8, 16, 32 and 64 elements
  and plots the counts against the shape of its Big-O. Sorts run on random, already sorted and reversed input,
  and the lab marks which input did the most and the least work *for that algorithm* (measured, not assumed:
  already sorted input is the best case of Insertion Sort but the worst case of this Quick Sort, whose pivot is
  the last element). Searches run with the target first, random, and missing. It also compares all sorting
  algorithms on the same input.
- Good classroom pairs: recursive Fibonacci vs. Fibonacci (DP table); Bubble vs. Merge Sort in the
  Complexity Lab; Linear vs. Binary Search; Insertion Sort vs. Quick Sort on sorted input.

## 5. Using your own code

Type or paste a program into the editor and press **Run**. If the program reads input (`cin`, `scanf`,
`Scanner`, `Console.ReadLine`, `input()`), open **Input (stdin)** under the editor and type the values.

**Code from the slides.** Lecture slides often show code that a modern compiler rejects. AlgoScope runs it anyway
and shows a yellow note saying what it adjusted:

- curly quotes (`“%d”`) and long dashes copied from a PDF
- old C with no return type (`main()`, `factorial(int n)`)
- Turbo C++ (`#include <iostream.h>`, `<conio.h>`, `void main()`) and Dev-C++ (`system("pause")`)
- Python 2 `print x`
- the textbook `IO.readInt()` class in Java

**Only a function, no `main()`?** Press **Add a main() for me** (or **Add a call for me** in Python). AlgoScope adds
a small `main()` that calls the function with sample values (the array `5 1 4 2 8 3`, sorted first for search
functions) and prints the result, then runs it.

**Console programs (Turbo C).** `clrscr`, `gotoxy`, `cprintf`/`cputs` and `cout` draw on a **Screen (console)** box
under the picture, and the screen changes are key steps. `getch()` reads one key from **Input (stdin)**, where you
can write arrow keys and other special keys as `<up> <down> <left> <right> <enter> <esc>`. Colors (`textcolor`) are
ignored.

**Structs that hold an array**, like the slides' `STACK` with `items[]` and `top` or `QUEUE` with `front` and
`rear`, are drawn as the array with `top` / `front` / `rear` marked, and the slots outside the stack or queue are
greyed out. In heap sort the array is also drawn as a tree.

**Supported:** variables, arithmetic, if/else, switch, for/while/do-while, break/continue, functions,
recursion, 1D and 2D arrays, strings (including changing C++ strings in place), structs and classes (constructors,
methods, inheritance, interfaces, abstract classes, generics and C++ templates), C pointers, double pointers and
`malloc`, C++ references, lambdas and comparators (`sort` with a compare function, `Comparator.comparingInt`,
`Comparable`/`IComparable`), exceptions (`throw`/`raise` with `try`/`catch`), and the usual collections: `vector`,
`stack`, `queue`, `priority_queue` (including `greater<>`), `map`, `set`, `pair`, `ArrayList`, `LinkedList`, `HashMap`,
`TreeMap`, `HashSet`, `PriorityQueue`, `List`, `Dictionary`, `Queue`, `Stack`, Python lists, dicts, sets, tuples,
`deque`, `defaultdict`, `Counter`, `heapq` and `@lru_cache`.

C structs, C++ objects and containers (`vector`, `map`...) and C# `struct`s are copied when assigned or passed by
value, exactly as in the real languages; pointers can walk through arrays and strings (`p++`, `p < arr + n`,
`*(p + i)`, `while (*s) s++`). Python supports `super()`, `nonlocal`, and `for`/`while` ... `else`.

Programs that only use plain variables (a GCD, a counting loop) show their variables as big tiles; the one that
just changed is highlighted.

**Not supported:** threads, files, Java streams, C# LINQ, operator overloading, and most of the standard library
beyond the collections above. When something is not supported, AlgoScope says which line.

**Checked against the real compilers:** 62 programs (45 typical lecture programs such as linked lists with double
pointers, BST insert/delete, heap sort, hash tables, infix-to-postfix, N-Queens, Floyd–Warshall, Kruskal, Dijkstra with
priority queues, topological sort, memoized DP, generic stacks and queues, interfaces and exceptions; the 12 programs from
the course slides; and 5 programs about struct copies, pointer walking and Python closures) print exactly what gcc, g++,
javac, .NET and CPython print. So do all 49 examples in every language. They run as automated tests before every update.

**Mistakes are explained, not crashed on:** an index out of bounds, a null pointer, dividing by zero, missing input,
runaway recursion or a missing indent each stop with a plain message on the right line. An endless loop stops after
5,000 steps with a hint to check the loop condition.

**Limits:** a run stops after 5,000 steps so the animation stays readable. Use small inputs (about 5–10
elements) for animations, and the Complexity Lab for bigger sizes.

## 6. In the classroom

- **Present** hides the editor and shows the picture large with the code beside it, like the lecture videos.
- **Projectors:** AlgoScope is checked at 1920×1080, 1366×768, 1280×720 and 1024×768. On short screens the picture
  shrinks just enough to stay above the explanation, arrays shrink to fit the width, and in Present mode the explanation
  moves above the code so the picture keeps the whole left side.
- **+ / −** enlarge or shrink the code and the picture for the projector.
- The **moon / sun** button switches to a dark theme, which often looks better on projectors.
- **Shareable links**: add options to the address to open a specific state, for example
  `https://codrei.github.io/AlgoScope/?example=merge-sort&lang=java&run=1&present=1`
  (`example`, `lang` = c / cpp / java / csharp / python, `run=1`, `step=40`, `present=1`, `theme=dark`, `lab=1`).

## Example list

| Topic | Examples |
|---|---|
| Algorithm Analysis | Euclid's GCD, Growth Rates (counting the steps of O(1), O(log n), O(n), O(n²) loops) |
| Sorting | Bubble, Selection, Insertion, Merge, Quick, Heap, Counting Sort |
| Searching | Linear Search, Binary Search, String Matching (brute force) |
| Recursion | Factorial, Fibonacci (recursive), Tower of Hanoi, Fast Power (divide and conquer) |
| Data Structures | Array Insert and Delete, Stack (array), Stack Using a Struct (C), Queue (circular array), Queue and Circular Queue (C), Balanced Parentheses, Infix to Postfix, Linked List (insert & reverse), Linked List (insert, find, delete; C++), Doubly Linked List, Hash Table (linear probing), Maze Game (2D array; Turbo C++) |
| Trees & Heaps | Binary Search Tree, Tree Traversals (pre/in/post/level order), Min-Heap (priority queue) |
| Dynamic Programming | Fibonacci (DP table), 0/1 Knapsack, Longest Common Subsequence, Coin Change (DP) |
| Graphs | BFS, DFS, Dijkstra's Shortest Path, Topological Sort, Prim's and Kruskal's Minimum Spanning Tree, Floyd–Warshall |
| Greedy & Backtracking | N-Queens, Coin Change (greedy), Activity Selection, Fractional Knapsack, Permutations |
| Hard Problems (NP) | Travelling Salesman (brute force), Subset Sum (brute force) |

Good pairs to compare in class: Coin Change greedy vs. DP (greedy uses 3 coins for 6, DP finds 2), Fractional vs. 0/1
Knapsack, Prim vs. Kruskal (same tree, different order), recursive vs. DP Fibonacci, and the NP examples to show how
n! and 2ⁿ grow.

Examples marked with a language (C, C++) exist only in that language, the way they appear on the course slides.
Every other example runs in all five languages and prints the same output.
