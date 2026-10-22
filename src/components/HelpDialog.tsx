import { X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useDialogFocus } from '../lib/useDialogFocus';

export function HelpDialog({ onClose, phone }: { onClose: () => void; phone?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useDialogFocus(ref);
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [onClose]);
  return (
    <div className="dialog-backdrop" onMouseDown={onClose}>
      <div className="dialog" ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="help-title" onMouseDown={(e) => e.stopPropagation()}>
        <button className="ghost-btn dialog-close" onClick={onClose} aria-label="Close"><X size={16} /></button>
        <h2 id="help-title">How to use AlgoScope</h2>
        {phone && (
          <>
            <h3>On your phone</h3>
            <ul>
              <li><b>Code</b> and <b>Watch</b> at the top switch between writing the program and watching it run. Pick a ready-made example from the menu at the very top.</li>
              <li>Press the yellow <b>Run</b> button at the bottom. AlgoScope switches to <b>Watch</b> by itself.</li>
              <li>The bar at the bottom moves through the run: <b>Back</b>, <b>Play</b> and <b>Next</b>, or drag the slider. You can also <b>swipe</b> the picture left for the next step and right for the step before. Above the bar you see which part of the algorithm you are in (for example <i>Pass 2 of 5</i>).</li>
              <li>Under the picture: what just happened, then the line of code that ran. Tap the code to see the whole program.</li>
              <li>The <b>⚙</b> button opens <b>Settings</b>: the speed, Key steps or Every line, Predict mode, the theme, color-blind friendly colors, and <b>Install as an app</b> to put AlgoScope on your home screen.</li>
            </ul>
          </>
        )}
        <p>
          AlgoScope runs your C, C++, Java, C# or Python code one line at a time and shows what it does: the line that is
          running, the variables, the call stack, and pictures of your arrays, lists, stacks, queues, trees and tables.
        </p>
        <h3>1. Write or pick code</h3>
        <ul>
          <li>Choose a language tab above the editor.</li>
          <li>Open <b>Examples</b> for ready-made examples from algorithm analysis, sorting, searching, recursion, data structures, trees and heaps, dynamic programming, graphs, greedy and backtracking, and NP-hard problems. Most run in all five languages; a few written for one language (for example the Turbo C++ maze game) are marked <i>C only</i> or <i>C++ only</i>.</li>
          <li>Or type / paste your own program. If it has no <code>main()</code> (like a function copied from a slide), press <b>Add a main() for me</b> and AlgoScope calls it with sample values.</li>
          <li>Code pasted from slides runs as written: curly quotes, <code>main()</code> without <code>int</code>, Turbo C++ headers and <code>void main</code>, and Python 2 <code>print x</code>. A yellow note says what was adjusted.</li>
        </ul>
        <h3>2. Run and step through</h3>
        <ul>
          <li>Press <b>Run</b> or <kbd>Ctrl</kbd>+<kbd>Enter</kbd>.</li>
          <li><kbd>Space</kbd> play / pause · <kbd>←</kbd> <kbd>→</kbd> one step back / forward · <kbd>Home</kbd> <kbd>End</kbd> first / last step. Drag the slider to jump anywhere.</li>
          <li>The highlighted line in the editor is the line that just ran. The <b>What just happened</b> box explains it in plain English. Open <b>In code terms</b> to see the technical version.</li>
        </ul>
        <h3>Focus and Full detail</h3>
        <ul>
          <li><b>Focus</b> (the default) shows the main picture, what the algorithm is doing (blue line), the explanation and the current variables.</li>
          <li><b>Full detail</b> adds the Big-O badges, counters (comparisons, swaps, calls), the full call stack, helper arrays and the recursion tree.</li>
        </ul>
        <h3>Following along</h3>
        <ul>
          <li>The <b>parts bar</b> above the controls splits the run into the parts of the algorithm (Pass 2 of 5, Merge [0..2], push(10)…). Click a part to jump there, or use <kbd>Page Up</kbd> / <kbd>Page Down</kbd>.</li>
          <li>In the built-in examples the big sentence explains the idea of each key moment with the real values (“Is 8 bigger than the key 4? Yes, so 8 shifts right”). The same step in code terms is the small grey line under it.</li>
          <li>Values move: a copied value slides to its new cell, and the cell it left is drawn as a dashed <b>gap</b>. Insertion Sort’s <code>key</code> floats above the gap until it is dropped in.</li>
          <li>In DP tables the cells a new value was <b>built from</b> get a dashed outline.</li>
          <li>The last step sums up the run (comparisons, swaps…) and what the Big-O means when the input doubles.</li>
        </ul>
        <h3>Key steps and Every line</h3>
        <ul>
          <li><b>Key steps</b> (the default) stops only where something happens: compares, swaps, changes, pointers moving, calls and output. Bubble Sort takes 28 key steps instead of 84 lines.</li>
          <li><b>Every line</b> stops on every line that runs, including loop counters and temporary variables.</li>
        </ul>
        <h3>Predict mode</h3>
        <ul>
          <li>Turn on <b>Predict</b> in the playback bar, then press <b>Play</b> or <b>Next</b>. Turning it on does not change the screen by itself: the run stops when it reaches the next comparison (“is 5 bigger than 1?”) or <code>if</code> decision (“is n &lt;= 1 true?”) and asks you or the class to guess.</li>
          <li>Answer with <b>Yes</b> / <b>No</b> or the <kbd>Y</kbd> / <kbd>N</kbd> keys. AlgoScope says whether the guess was right, keeps a score for the run, and shows what happened. Press Play or Next to go on.</li>
          <li>Loop checks (“is i &lt; n true?”) are not asked, because they repeat every round.</li>
        </ul>
        <h3>Settings and installing</h3>
        <ul>
          <li><b>Settings</b> (top bar) has every option in one place: theme (light, dark or same as the device), text size, color-blind friendly colors, animations, how much to show, which steps, speed, Predict mode, and whether a run starts playing by itself. They are saved on this device; <b>Reset all settings</b> brings back the defaults.</li>
          <li><b>Install as an app</b> (in Settings) puts AlgoScope on your home screen or computer. It opens in its own window and works without internet.</li>
        </ul>
        <h3>What the colors mean</h3>
        <div className="legend">
          <span><i className="compare" /> compared</span>
          <span><i className="swap" /> swapped</span>
          <span><i className="write" /> changed</span>
          <span><i className="locked" /> locked in its final place</span>
          <span><i className="marker" /> index variable (i, j, mid…)</span>
        </div>
        <h3>For the classroom</h3>
        <ul>
          <li><b>Present</b> shows the picture large with the code underneath, like a lecture slide.</li>
          <li><b>Settings → Text size</b> (+ / −) makes the code and the picture bigger for projectors. <b>Settings → Theme</b> switches light and dark.</li>
          <li>The counters show how many comparisons, swaps and calls the algorithm made, which is a way to compare
            O(n²) and O(n log n) on the same input.</li>
        </ul>
        <h3>What is supported</h3>
        <p>
          The code written in Data Structures &amp; Algorithms and Algorithms &amp; Complexity: variables, loops, if/else,
          switch, functions, recursion, 1D/2D arrays, strings, structs and classes (constructors, methods, inheritance,
          interfaces, generics and templates), C pointers and <code>malloc</code>, C++ references, lambdas and comparators,
          exceptions (<code>throw</code>/<code>raise</code> with <code>try</code>/<code>catch</code>), and the usual
          collections: <code>vector</code>, <code>stack</code>, <code>queue</code>, <code>priority_queue</code>,{' '}
          <code>map</code>, <code>ArrayList</code>, <code>HashMap</code>, <code>PriorityQueue</code>, <code>List</code>,{' '}
          <code>Dictionary</code>, Python lists, dicts, sets, <code>deque</code>, <code>heapq</code> and{' '}
          <code>@lru_cache</code>. Turbo C console programs work too: <code>clrscr</code>, <code>gotoxy</code> and{' '}
          <code>cprintf</code> draw on a <b>Screen (console)</b> box, and <code>getch()</code> reads keys typed in{' '}
          <b>Input (stdin)</b> as <code>&lt;up&gt; &lt;down&gt; &lt;left&gt; &lt;right&gt; &lt;enter&gt; &lt;esc&gt;</code>.
        </p>
        <p className="notice">
          It is a teaching interpreter, not a full compiler: threads, files, LINQ/streams and most of the standard
          library beyond the collections above are not supported, and AlgoScope tells you which line if it meets one.
          Animations stop after 5,000 steps, so use small inputs (about 5–10 elements). Very big data is limited so it cannot freeze your phone or laptop: big arrays show a window of 100 cells, and a run stops if its data grows past a few million values.
        </p>
      </div>
    </div>
  );
}
