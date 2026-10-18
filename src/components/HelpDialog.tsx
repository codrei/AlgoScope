import { X } from 'lucide-react';
import { useEffect } from 'react';

export function HelpDialog({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [onClose]);
  return (
    <div className="dialog-backdrop" onMouseDown={onClose}>
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="help-title" onMouseDown={(e) => e.stopPropagation()}>
        <button className="ghost-btn dialog-close" onClick={onClose} aria-label="Close"><X size={16} /></button>
        <h2 id="help-title">How to use AlgoScope</h2>
        <p>
          AlgoScope runs your C, C++, Java, C# or Python code one line at a time and shows what it does: the line that is
          running, the variables, the call stack, and pictures of your arrays, lists, stacks, queues, trees and tables.
        </p>
        <h3>1. Write or pick code</h3>
        <ul>
          <li>Choose a language tab above the editor.</li>
          <li>Open <b>Examples</b> for ready-made sorting, searching, recursion, data structure, dynamic programming and graph algorithms. Every example exists in all five languages.</li>
          <li>Or type / paste your own program. It needs a normal entry point: <code>main()</code> in C/C++/Java/C#, or top-level code in Python.</li>
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
        <h3>Key steps and Every line</h3>
        <ul>
          <li><b>Key steps</b> (the default) stops only where something happens: compares, swaps, changes, pointers moving, calls and output. Bubble Sort takes 28 key steps instead of 84 lines.</li>
          <li><b>Every line</b> stops on every line that runs, including loop counters and temporary variables.</li>
        </ul>
        <h3>Predict mode</h3>
        <ul>
          <li>Turn on <b>Predict</b> in the playback bar to pause before every comparison and let the class guess. Answer with <b>Yes</b> / <b>No</b> or the <kbd>Y</kbd> / <kbd>N</kbd> keys.</li>
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
          <li><b>+ / −</b> make the code bigger for projectors. The moon / sun button switches dark and light themes.</li>
          <li>The counters show how many comparisons, swaps and calls the algorithm made, which is a way to compare
            O(n²) and O(n log n) on the same input.</li>
        </ul>
        <h3>What is supported</h3>
        <p>
          AlgoScope runs the kind of code written in Data Structures &amp; Algorithms and Algorithms &amp; Complexity:
          variables, loops, if/else, switch, functions, recursion, arrays (1D and 2D), strings, structs and classes (for
          nodes), pointers in C/C++, and common library collections: <code>vector</code>, <code>stack</code>,
          <code>queue</code>, <code>map</code>, <code>ArrayList</code>, <code>HashMap</code>, <code>List</code>,
          <code>Dictionary</code>, Python lists, dicts, sets and <code>deque</code>.
        </p>
        <p className="notice">
          It is a teaching interpreter, not a full compiler. Templates/generics you write yourself, exceptions, threads,
          files and most of the standard library are not supported. If something isn't supported, AlgoScope tells you
          which line. Programs stop after 5,000 steps to keep the animation readable, so use small inputs.
        </p>
      </div>
    </div>
  );
}
