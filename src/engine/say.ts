// Plain-English explanations of each step, for students who are new to the topic.
import type { StepKind } from './trace';

export type CheckCtx = 'if' | 'ifelse' | 'loop';

export const OP_WORDS: Record<string, string> = {
  '>': 'greater than',
  '<': 'less than',
  '>=': 'greater than or equal to',
  '<=': 'less than or equal to',
  '==': 'equal to',
  '!=': 'different from',
};

export function consequence(ctx: CheckCtx | undefined, result: boolean | undefined): string {
  if (result === undefined || !ctx) return '.';
  switch (ctx) {
    case 'if': return result ? ', so the code inside the if runs.' : ', so the code inside the if is skipped.';
    case 'ifelse': return result ? ', so the if part runs.' : ', so the else part runs.';
    case 'loop': return result ? ', so the loop body runs.' : ', so the loop ends.';
  }
}

const yes = (s: string) => (s === 'true' ? 'Yes' : 'No');

/** Turns a condition into a question a beginner can read. */
export function question(src: string): string {
  let m: RegExpExecArray | null;
  if ((m = /^(.+?)\s*(?:is not None|!=\s*(?:nullptr|NULL|null|None))$/.exec(src))) return `Does ${m[1]} point to something (not empty)?`;
  if ((m = /^(.+?)\s*(?:is None|==\s*(?:nullptr|NULL|null|None))$/.exec(src))) return `Is ${m[1]} empty (pointing to nothing)?`;
  if ((m = /^(?:!|not )\s*(\w+(?:\[[^\]]+\])?)$/.exec(src))) return `Is ${m[1]} false?`;
  if ((m = /^(?:!|not )\s*(\w+(?:\.\w+)?)\(\)$/.exec(src))) return `Is ${m[1]}() false?`;
  return `Is ${src} true?`;
}

/** A short engine note (assignment, push, print...) in plain English. */
export function plainNote(note: string): string {
  let m: RegExpExecArray | null;
  if ((m = /^PRINT "(.*)"$/s.exec(note))) return `Show "${m[1]}" in the output.`;
  if ((m = /^READ (.*)$/.exec(note))) return `Read the input: ${m[1]}.`;
  if ((m = /^PUSH (.*)$/.exec(note))) return `Push ${m[1]} onto the top.`;
  if ((m = /^POP_BACK (.*)$/.exec(note))) return `Remove the last item (${m[1]}).`;
  if ((m = /^POP (.*)$/.exec(note))) return `Pop: take ${m[1]} out.`;
  if ((m = /^ENQUEUE (.*)$/.exec(note))) return `Add ${m[1]} to the back of the queue.`;
  if ((m = /^DEQUEUE (.*)$/.exec(note))) return `Take ${m[1]} from the front of the queue.`;
  if ((m = /^ADD FRONT (.*)$/.exec(note))) return `Add ${m[1]} to the front.`;
  if ((m = /^REMOVE LAST (.*)$/.exec(note))) return `Remove the last item (${m[1]}).`;
  if ((m = /^(?:ADD|APPEND) (.*) → (.*)$/.exec(note))) return `Store ${m[2]} under the key ${m[1]}.`;
  if ((m = /^(?:ADD|APPEND) (.*)$/.exec(note))) return `Add ${m[1]} to the end.`;
  if ((m = /^INSERT (.*) at (.*)$/.exec(note))) return `Insert ${m[1]} at position ${m[2]}.`;
  if ((m = /^PUT (.*) → (.*)$/.exec(note))) return `Store ${m[2]} under the key ${m[1]}.`;
  if (/^SORT/.test(note)) return 'Sort everything at once with the built-in sort.';
  if ((m = /^SWAP (.*) ↔ (.*)$/.exec(note))) return `Swap ${m[1]} and ${m[2]}.`;
  if ((m = /^heappush (.*)$/.exec(note))) return `Add ${m[1]} to the heap.`;
  if ((m = /^heappop → (.*)$/.exec(note))) return `Take the smallest item (${m[1]}) out of the heap.`;
  if (/^free memory/.test(note)) return 'Give the memory back (free).';
  if ((m = /^(.*)\(…\) returned (.*)$/.exec(note))) return `${m[1]} finished and gave back ${m[2]}.`;
  if ((m = /^(.*)\(…\) (?:finished|done)$/.exec(note))) return `${m[1]} finished.`;
  if ((m = /^(.*)\(…\) → (.*)$/.exec(note))) return `${m[1]} gave back ${m[2]}.`;
  if ((m = /^(\S+)\+\+ → (.*)$/.exec(note))) return `Add 1 to ${m[1]} (now ${m[2]}).`;
  if ((m = /^(\S+)-- → (.*)$/.exec(note))) return `Subtract 1 from ${m[1]} (now ${m[2]}).`;
  if ((m = /^(\S+) ([+\-*/%])= (.*) → (.*)$/.exec(note))) {
    const [, v, op, x, r] = m;
    if (op === '+') return `Add ${x} to ${v} (now ${r}).`;
    if (op === '-') return `Subtract ${x} from ${v} (now ${r}).`;
    if (op === '*') return `Multiply ${v} by ${x} (now ${r}).`;
    if (op === '/') return `Divide ${v} by ${x} (now ${r}).`;
    return `${v} becomes the remainder after dividing by ${x} (now ${r}).`;
  }
  if ((m = /^(\S+) \+= (.*)$/.exec(note))) return `Add ${m[2]} to the end of ${m[1]}.`;
  if ((m = /^(.*\]) = (.*)$/.exec(note))) return `Put ${m[2]} into ${m[1]}.`;
  if ((m = /^([\w.>-]+(?:, [\w.>-]+)+) = (.*)$/.exec(note))) return `${m[1]} are now ${m[2]}.`;
  if ((m = /^([\w.>-]+) = (.*)$/.exec(note))) return `${m[1]} is now ${m[2]}.`;
  return note;
}

/** Plain-English version of a step's technical narration. */
export function plain(kind: StepKind, text: string, ctx?: CheckCtx, result?: boolean): string {
  let m: RegExpExecArray | null;
  if (kind === 'start') return 'The program starts here.';
  if (kind === 'end') return 'The program is finished. Look at the output below.';
  if ((m = /^ERROR: (.*)$/s.exec(text))) return `Something went wrong: ${m[1]}`;
  if ((m = /^CALL (.*)$/.exec(text))) return `Jump into ${m[1]} and run its code.`;
  if ((m = /^NEW (.*)$/.exec(text))) return `Create a new ${m[1]}.`;
  if ((m = /^RETURN (.*) from (.*)$/.exec(text))) return `${m[2]} is done and gives back ${m[1]}.`;
  if ((m = /^RETURN from (.*)$/.exec(text))) return `${m[1]} is done. Go back to where it was called.`;
  if (/^RETURN/.test(text)) return 'Leave the function.';
  if (/^BREAK/.test(text)) return 'break: jump out of the loop right now.';
  if (/^CONTINUE/.test(text)) return 'continue: skip the rest and start the next round of the loop.';
  if (text === 'pass') return 'pass: do nothing.';
  if ((m = /^SWITCH (.*)$/.exec(text))) return `Go to the case that matches ${m[1]}.`;
  if ((m = /^FOR (\S+) in (.*) · loop finished$/.exec(text))) return `No more items in ${m[2]}, so the loop ends.`;
  if ((m = /^FOR (.*?) = (.*)$/.exec(text))) return `Next round of the loop: ${m[1]} = ${m[2]}.`;
  if ((m = /^IF (.*) → (true|false)$/.exec(text))) return `${question(m[1])} ${yes(m[2])}${consequence(ctx ?? 'if', m[2] === 'true')}`;
  if ((m = /^WHILE (.*) → (true|false)/.exec(text))) return `${question(m[1])} ${yes(m[2])}${consequence('loop', m[2] === 'true')}`;
  if ((m = /^(?:(.*) · )?CHECK (.*) → (true|false)/.exec(text))) {
    const pre = m[1]
      ? m[1].split(', ').map((p) => (/^[\w.]+ = /.test(p) ? `Start the loop with ${p}.` : plainNote(p))).join(' ') + ' '
      : '';
    return `${pre}${question(m[2])} ${yes(m[3])}${consequence('loop', m[3] === 'true')}`;
  }
  if (/^DELETE/.test(text)) return 'Delete the item.';
  void result;
  return plainNote(text);
}
