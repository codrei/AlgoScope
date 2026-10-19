# AlgoScope

**See your code think.** AlgoScope is a code editor for **C, C++, Java, C# and Python** that runs your program
one line at a time and animates what it does: the line that is running, the variables, the call stack, and
pictures of arrays, stacks, queues, linked lists, trees, hash maps and DP tables.

It is built for teaching **Data Structures & Algorithms** and **Algorithms & Complexity**.

**Live:** https://codrei.github.io/AlgoScope/ · [User guide](docs/USER_GUIDE.md) · [Testing checklist & demo script](docs/TESTING_CHECKLIST.md)

## Features

- Code editor with syntax highlighting for all five languages
- Step-by-step playback (play, pause, step back/forward, speed control, slider)
- Narration of every step: `COMPARE arr[0] (5) > arr[1] (1) → true`, `SWAP arr[0] ↔ arr[1]`, `CALL fib(3)`...
- Array cells light up when compared, swapped or changed; elements turn green once they are locked in place
- Counters for comparisons, swaps and function calls, to compare algorithms' complexity in practice
- Complexity Lab: reruns an algorithm on growing inputs, plots the counts against its Big-O, and marks which
  input is that algorithm's measured best and worst case
- Recursion tree, graph drawing for adjacency matrices, linked lists and trees as nodes and arrows
- Built-in library of 49 examples covering a full DSA and Algorithms & Complexity course: algorithm analysis,
  sorting, searching, recursion, data structures, trees and heaps, dynamic programming, graphs, greedy and
  backtracking, and NP-hard problems, most in all five languages, plus a few single-language programs from the course slides
- Runs code as it appears on lecture slides (K&R C, Turbo C++ with `conio.h`, curly quotes, Python 2 print) and
  adds a `main()` for slides that show only a function
- Console screen for Turbo C programs (`gotoxy`, `getch` with arrow keys)
- Present mode for projectors (checked at 1080p, 768p, 720p and 1024×768), dark/light theme, adjustable text size
- Clear messages for student mistakes (index out of bounds, null pointer, endless loop, missing indent...)
- Runs fully in the browser, so no server and no installation are needed

## Running locally

```bash
npm install
npm run dev      # development server
npm test         # every example in every language + the compiler-checked corpus
npm run e2e      # click-through interface tests (Playwright)
./scripts/reference-outputs.sh   # re-record real compiler outputs for tests/corpus (needs gcc, g++, JDK, .NET, python3)
npm run build    # production build in dist/
```

## How it works

1. The code is parsed with [tree-sitter](https://tree-sitter.github.io/) grammars for C/C++, Java, C# and Python.
2. Each language's syntax tree is translated into one shared program format (`src/engine/ir.ts`).
3. A teaching interpreter (`src/engine/interp.ts`) runs that program and records a snapshot after every line.
4. The visualizer (`src/components`) replays the snapshots.

AlgoScope supports the subset of each language used in DSA courses: variables, loops, conditionals, functions,
recursion, arrays, strings, structs/classes, C pointers and the common collections. It is a teaching tool, not a
full compiler.
