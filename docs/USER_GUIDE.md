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
  (random, sorted and reversed input) and plots the counts against the shape of its Big-O. It also compares
  all sorting algorithms on the same input.
- Good classroom pairs: recursive Fibonacci vs. Fibonacci (DP table); Bubble vs. Merge Sort in the
  Complexity Lab; Linear vs. Binary Search.

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

**Not supported:** threads, files, Java streams, C# LINQ, operator overloading, and most of the standard library
beyond the collections above. When something is not supported, AlgoScope says which line.

**Checked against the real compilers:** 45 typical lecture programs (linked lists with double pointers, BST insert/delete,
heap sort, hash tables, infix-to-postfix, N-Queens, Floyd–Warshall, Kruskal, Dijkstra with priority queues, topological
sort, memoized DP, generic stacks and queues, interfaces, exceptions and more) print exactly what gcc, g++, javac, .NET and
CPython print. They run as automated tests before every update.

**Limits:** a run stops after 5,000 steps so the animation stays readable. Use small inputs (about 5–10
elements) for animations, and the Complexity Lab for bigger sizes.

## 6. In the classroom

- **Present** hides the editor and shows the picture large with the code underneath, like the lecture videos.
- **+ / −** enlarge or shrink the code and the picture for the projector.
- The **moon / sun** button switches to a dark theme, which often looks better on projectors.
- **Shareable links**: add options to the address to open a specific state, for example
  `https://codrei.github.io/AlgoScope/?example=merge-sort&lang=java&run=1&present=1`
  (`example`, `lang` = c / cpp / java / csharp / python, `run=1`, `step=40`, `present=1`, `theme=dark`, `lab=1`).

## Example list

| Topic | Examples |
|---|---|
| Sorting | Bubble, Selection, Insertion, Merge, Quick, Heap, Counting Sort |
| Searching | Linear Search, Binary Search, String Matching (brute force) |
| Recursion | Factorial, Fibonacci (recursive), Tower of Hanoi |
| Data Structures | Stack (array), Stack Using a Struct (C), Queue (circular array), Queue and Circular Queue (C), Balanced Parentheses, Linked List (insert & reverse), Linked List (insert, find, delete; C++), Binary Search Tree, Hash Table (linear probing), Maze Game (2D array; Turbo C++) |
| Dynamic Programming | Fibonacci (DP table), 0/1 Knapsack, Longest Common Subsequence |
| Graphs | BFS, DFS, Dijkstra's Shortest Path, Topological Sort, Prim's Minimum Spanning Tree, Floyd–Warshall |
| Greedy & Backtracking | N-Queens, Coin Change (greedy), Activity Selection |

Examples marked with a language (C, C++) exist only in that language, the way they appear on the course slides.
Every other example runs in all five languages and prints the same output.
