# AlgoScope: Testing Checklist and Demo Script

For the team, before the demo. Use https://codrei.github.io/AlgoScope/ (hard refresh with Ctrl + Shift + R
after an update).

## Quick check (10 minutes)

- [ ] The page opens and shows **Bubble Sort**.
- [ ] **Run** animates; the gold line in the editor moves with the steps.
- [ ] Space pauses, ← → step, the slider jumps, the speed menu works.
- [ ] Switch each language tab (C, C++, Java, C#, Python) and Run: the output panel says `Sorted: 1 2 3 4 5 8` every time.
- [ ] Present mode, dark theme, + / − all work.
- [ ] Complexity button opens the lab and draws the chart for a sorting example.

## Full check: every example in every language

Open each example, run it in all five languages, and check the output and the picture.

| Example | Expected output | Look for |
|---|---|---|
| Bubble / Selection / Insertion / Merge / Quick Sort | `Sorted: 1 2 3 4 5 8` | compare bracket, swap hop, green locked cells, `i`/`j` tags |
| Linear Search | `Found 18 at index 4` | `i` moves along the array |
| Binary Search | `Found 23 at index 5` | `low` / `mid` / `high` tags, faded cells outside the range |
| Factorial | `5! = 120` | recursion tree with return values |
| Fibonacci (Recursive) | `fib(5) = 5` | 15 calls in the recursion tree |
| Tower of Hanoi | 7 "Move disk…" lines | recursion tree |
| Stack (Array) | Pushed / Popped lines | `top` tag moves |
| Queue (Circular Array) | Enqueued / Dequeued lines | `front` / `rear` tags wrap around |
| Balanced Parentheses | `{[()]} is balanced`, `([)] is not balanced` | the stack grows and shrinks |
| Linked List | two lines, the second reversed | nodes and arrows; `prev`, `cur`, `next` labels move |
| Binary Search Tree | `Inorder: 20 30 40 50 60 70 80` | tree drawing |
| Fibonacci (DP Table) | `fib(10) = 55` | the dp array fills left to right |
| 0/1 Knapsack | `Maximum value = 9` | the dp table fills row by row |
| LCS | `LCS length = 4` | the dp table |
| BFS / DFS | `BFS: 0 1 2 3 4 5` / `DFS: 0 1 3 5 4 2` | graph drawing, visited vertices turn green |
| Dijkstra | five `Vertex i: d` lines | distances under the vertices, ∞ at the start |

Write down anything that looks wrong (example, language, step number) and send it to Marco.

## Try your own code

Paste programs from your class notes. If one fails, note the language, the error message and the line.
That's how we find unsupported features before the professor does.

## Demo script (about 5 minutes)

1. **The problem (30 s):** algorithms are hard to picture from code alone. AlgoScope runs the code and shows each step.
2. **Bubble Sort in C++ (1 min):** Run, then pause and step: compare, swap, the gold line, the green locked cells.
3. **Same algorithm, other language (30 s):** switch to Python or Java and Run. The engine supports C, C++, Java, C# and Python.
4. **Data structures (1 min):** Linked List: stop during `reverse` and point at prev / cur / next. Then BST.
5. **Recursion and DP (1 min):** recursive Fibonacci (recursion tree, 15 calls), then Fibonacci DP table.
6. **Predict (30 s):** turn on Predict, let the audience guess one comparison, answer with Y / N.
7. **Complexity (1 min):** open the Complexity Lab on Bubble Sort, show the n² curve, then the bar chart
   comparing all sorts.
8. **Own code (30 s):** paste a function from a slide (no `main()`), Run, then press **Add a main() for me**.
9. **Slide programs (30 s):** Examples → Data Structures → Stack Using a Struct, then Maze Game to show the console screen.

## Likely questions

- **How does it run five languages in the browser?** The code is parsed with tree-sitter grammars, translated
  into one shared format, and run by our own interpreter, which records every step. No server or compiler is needed.
- **Is it a real compiler?** No, it's a teaching interpreter for the parts of each language used in DSA
  courses. That keeps it fast and safe, and lets it explain every comparison and swap.
- **How does it know when something is a swap?** When two elements of the same array exchange values within a
  few steps, the engine marks it as a swap. That works whether the code uses a temp variable, `swap()`, or Python's `a, b = b, a`.
- **Does it work without internet?** Yes, after the first visit the browser keeps a copy of the app.
- **How do you know it's correct?** 45 typical lecture programs and 12 programs from the course
  lessons print exactly what the real compilers (gcc, g++, javac, .NET, CPython) print. Together with the engine
  tests (244 in all) and 17 click-through interface tests, they run on every example in every language before each
  update is published.
