import { BookOpen, ChevronDown, CircleHelp, Minus, Monitor, Moon, Plus, Sun, TrendingUp } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { EXAMPLES, type Example, type Topic } from '../examples';

const TOPICS: Topic[] = ['Sorting', 'Searching', 'Recursion', 'Data Structures', 'Dynamic Programming', 'Graphs'];

export function BrandMark() {
  return (
    <svg className="brand-mark" viewBox="0 0 40 40" aria-hidden="true">
      <rect width="40" height="40" rx="10" fill="#FBD413" />
      <circle cx="17" cy="17" r="9.5" fill="none" stroke="#363583" strokeWidth="3.4" />
      <line x1="24.2" y1="24.2" x2="32" y2="32" stroke="#363583" strokeWidth="4.2" strokeLinecap="round" />
      <path d="M14.6 13.2 11.4 17l3.2 3.8M19.4 13.2l3.2 3.8-3.2 3.8" stroke="#363583" strokeWidth="2.1" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

interface Props {
  exampleId: string | null;
  onExample: (e: Example) => void;
  present: boolean;
  onPresent: () => void;
  dark: boolean;
  onDark: () => void;
  onHelp: () => void;
  onLab: () => void;
  onZoom: (d: number) => void;
}

export function TopBar(p: Props) {
  const [open, setOpen] = useState(() => new URLSearchParams(window.location.search).get('menu') === '1');
  const wrap = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);

  const current = EXAMPLES.find((e) => e.id === p.exampleId);
  return (
    <header className="topbar">
      <div className="brand">
        <BrandMark />
        <div>
          <div className="brand-name">Algo<span>Scope</span></div>
          <div className="brand-tag">See your code think</div>
        </div>
      </div>
      <div className="menu-wrap" ref={wrap}>
        <button className="topbar-btn" onClick={() => setOpen(!open)} aria-expanded={open} aria-haspopup="menu">
          <BookOpen size={16} /> <span className="label keep">{current ? current.title : 'Examples'}</span> <ChevronDown size={15} />
        </button>
        {open && (
          <div className="menu" role="menu">
            {TOPICS.map((t) => {
              const items = EXAMPLES.filter((e) => e.topic === t);
              if (!items.length) return null;
              return (
                <div className="menu-group" key={t}>
                  <h4>{t}</h4>
                  {items.map((e) => (
                    <button
                      key={e.id}
                      role="menuitem"
                      className={`menu-item ${e.id === p.exampleId ? 'active' : ''}`}
                      onClick={() => {
                        p.onExample(e);
                        setOpen(false);
                      }}
                    >
                      <span>{e.title}</span>
                      <small>{e.time}</small>
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>
      <button className="topbar-btn" onClick={p.onLab} title="Complexity Lab: measure how the work grows with the input size">
        <TrendingUp size={16} /> <span className="label">Complexity</span>
      </button>
      <div className="topbar-spacer" />
      <button className="topbar-btn hide-sm" onClick={() => p.onZoom(-1)} title="Smaller text" aria-label="Smaller text"><Minus size={16} /></button>
      <button className="topbar-btn hide-sm" onClick={() => p.onZoom(1)} title="Bigger text (for projectors)" aria-label="Bigger text"><Plus size={16} /></button>
      <button className={`topbar-btn hide-sm ${p.present ? 'active' : ''}`} onClick={p.onPresent} title="Present mode: big visualization with the code underneath">
        <Monitor size={16} /> <span className="label">Present</span>
      </button>
      <button className="topbar-btn" onClick={p.onDark} title={p.dark ? 'Light theme' : 'Dark theme'} aria-label="Toggle theme">
        {p.dark ? <Sun size={16} /> : <Moon size={16} />}
      </button>
      <button className="topbar-btn" onClick={p.onHelp} title="How to use AlgoScope" aria-label="Help">
        <CircleHelp size={16} /> <span className="label">Help</span>
      </button>
    </header>
  );
}
