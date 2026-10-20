import Editor, { type OnMount } from '@monaco-editor/react';
import { AlertTriangle, ChevronDown, ChevronRight, Loader2, Play, RotateCcw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { Lang } from '../engine/ir';
import '../monaco/setup';

export const LANGS: { id: Lang; label: string; monaco: string }[] = [
  { id: 'c', label: 'C', monaco: 'cpp' },
  { id: 'cpp', label: 'C++', monaco: 'cpp' },
  { id: 'java', label: 'Java', monaco: 'java' },
  { id: 'csharp', label: 'C#', monaco: 'csharp' },
  { id: 'python', label: 'Python', monaco: 'python' },
];

type MonacoEditor = Parameters<OnMount>[0];
type MonacoNS = Parameters<OnMount>[1];

interface Props {
  lang: Lang;
  code: string;
  onLang: (l: Lang) => void;
  onCode: (c: string) => void;
  onRun: () => void;
  onReset: () => void;
  running: boolean;
  execLine: number | null;
  errorLine: number | null;
  error: string | null;
  stale: boolean;
  notices?: string[];
  /** generated code with a main() that calls the user's function */
  suggestion?: { code: string; calls: string } | null;
  onUseSuggestion?: () => void;
  stdin: string;
  onStdin: (s: string) => void;
  dark: boolean;
  fontSize: number;
  /** phones: wrap long lines instead of scrolling sideways */
  wrap?: boolean;
}

export function EditorPane(p: Props) {
  const editorRef = useRef<MonacoEditor | null>(null);
  const monacoRef = useRef<MonacoNS | null>(null);
  const decoRef = useRef<{ clear: () => void; set: (d: unknown[]) => void } | null>(null);
  const [stdinOpen, setStdinOpen] = useState(!!p.stdin);
  const runRef = useRef(p.onRun);
  runRef.current = p.onRun;

  const onMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    defineThemes(monaco);
    monaco.editor.setTheme(p.dark ? 'nu-dark' : 'nu-light');
    const coll = editor.createDecorationsCollection([]);
    decoRef.current = { clear: () => coll.clear(), set: (d) => coll.set(d as never) };
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => runRef.current());
  };

  useEffect(() => {
    monacoRef.current?.editor.setTheme(p.dark ? 'nu-dark' : 'nu-light');
  }, [p.dark]);

  useEffect(() => {
    const ed = editorRef.current;
    const monaco = monacoRef.current;
    if (!ed || !monaco || !decoRef.current) return;
    const decos: unknown[] = [];
    if (p.execLine && !p.stale) {
      decos.push({
        range: new monaco.Range(p.execLine, 1, p.execLine, 1),
        options: { isWholeLine: true, className: 'exec-line', linesDecorationsClassName: 'exec-glyph' },
      });
      ed.revealLineInCenterIfOutsideViewport(p.execLine);
    }
    if (p.errorLine) {
      decos.push({
        range: new monaco.Range(p.errorLine, 1, p.errorLine, 1),
        options: { isWholeLine: true, className: 'error-line' },
      });
      if (!p.execLine) ed.revealLineInCenterIfOutsideViewport(p.errorLine);
    }
    decoRef.current.set(decos);
  }, [p.execLine, p.errorLine, p.stale, p.code]);

  const monacoLang = LANGS.find((l) => l.id === p.lang)!.monaco;

  return (
    <section className="panel editor-panel" aria-label="Code editor">
      <div className="editor-head">
        <div className="lang-tabs" role="tablist" aria-label="Language">
          {LANGS.map((l) => (
            <button
              key={l.id}
              role="tab"
              aria-selected={p.lang === l.id}
              className={`lang-tab ${p.lang === l.id ? 'active' : ''}`}
              onClick={() => p.onLang(l.id)}
            >
              {l.label}
            </button>
          ))}
        </div>
        <button className="ghost-btn" aria-label="Reset" onClick={p.onReset} title="Restore the example's original code">
          <RotateCcw size={15} /> <span className="reset-label">Reset</span>
        </button>
        <button className="run-btn" onClick={p.onRun} disabled={p.running} title="Run (Ctrl+Enter)">
          {p.running ? <Loader2 size={17} className="spin" /> : <Play size={17} fill="currentColor" />} Run
        </button>
      </div>
      <div className="editor-wrap">
        <Editor
          language={monacoLang}
          value={p.code}
          onChange={(v) => p.onCode(v ?? '')}
          onMount={onMount}
          theme={p.dark ? 'nu-dark' : 'nu-light'}
          options={{
            fontSize: p.fontSize,
            fontFamily: "'JetBrains Mono', Consolas, monospace",
            fontLigatures: false,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            wordWrap: p.wrap ? 'on' : 'off',
            tabSize: 4,
            glyphMargin: false,
            lineNumbersMinChars: 3,
            renderLineHighlight: 'none',
            padding: { top: 10 },
            smoothScrolling: true,
            stickyScroll: { enabled: false },
          }}
        />
      </div>
      {p.notices?.map((n) => <div className="run-notice" key={n}>{n}</div>)}
      {p.stale && !p.error && <div className="stale-note">The code changed. Press <b>Run</b> to visualize the new version.</div>}
      {p.suggestion && (
        <div className="suggest-bar">
          <span>
            {p.error ? 'This code has no main(), so nothing runs yet.' : 'This code only defines functions and never calls them.'} AlgoScope can add a {p.error ? 'main()' : 'call'} that tries <b>{p.suggestion.calls}()</b> with sample values.
          </span>
          <button className="run-btn small" onClick={p.onUseSuggestion}>{p.error ? 'Add a main() for me' : 'Add a call for me'}</button>
        </div>
      )}
      {p.error && !p.suggestion && (
        <div className="compile-error" role="alert">
          <AlertTriangle size={17} style={{ flexShrink: 0, marginTop: 2, color: 'var(--error)' }} />
          <div>
            <strong>{p.errorLine ? `Line ${p.errorLine}: ` : ''}</strong>
            {p.error}
          </div>
        </div>
      )}
      <div className="editor-foot">
        <button className="stdin-toggle" onClick={() => setStdinOpen(!stdinOpen)} aria-expanded={stdinOpen}>
          {stdinOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />} Input (stdin){p.stdin && !stdinOpen ? ' · has input' : ''}
        </button>
        {stdinOpen && (
          <textarea
            className="stdin-box"
            value={p.stdin}
            onChange={(e) => p.onStdin(e.target.value)}
            placeholder="Values your program reads (cin, scanf, Scanner, Console.ReadLine, input()), separated by spaces or new lines. For getch() keys type <up> <down> <left> <right> <esc> or plain letters."
            spellCheck={false}
          />
        )}
      </div>
    </section>
  );
}

function defineThemes(monaco: MonacoNS) {
  monaco.editor.defineTheme('nu-light', {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'keyword', foreground: '7a2fc0' },
      { token: 'type', foreground: '1f5fa8' },
      { token: 'number', foreground: 'b35c00' },
      { token: 'string', foreground: '2b8a3e' },
      { token: 'comment', foreground: '8a8aa8', fontStyle: 'italic' },
    ],
    colors: {
      'editor.background': '#ffffff',
      'editorLineNumber.foreground': '#a3a3c2',
      'editorLineNumber.activeForeground': '#363583',
      'editor.selectionBackground': '#d9d9f3',
      'editorCursor.foreground': '#363583',
    },
  });
  monaco.editor.defineTheme('nu-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'keyword', foreground: 'c792ea' },
      { token: 'type', foreground: '82aaff' },
      { token: 'number', foreground: 'f78c6c' },
      { token: 'string', foreground: 'c3e88d' },
      { token: 'comment', foreground: '6b6fa8', fontStyle: 'italic' },
    ],
    colors: {
      'editor.background': '#15163d',
      'editorLineNumber.foreground': '#4f5291',
      'editorLineNumber.activeForeground': '#fbd413',
      'editor.selectionBackground': '#2f3180',
      'editorCursor.foreground': '#fbd413',
    },
  });
}
