// Phones: the controls live in one bar at the bottom of the screen, where the thumb is.
// Code view: a big Run button. Watch view: where we are, a scrubber, Back / Play / Next and settings.
import { ChevronLeft, ChevronRight, Loader2, Pause, Play, Settings2, X } from 'lucide-react';
import { useEffect } from 'react';
import { SPEEDS } from './Playback';

interface BarProps {
  view: 'code' | 'watch';
  running: boolean;
  onRun: () => void;
  chapters: { pos: number; label: string }[];
  pos: number;
  total: number;
  playing: boolean;
  onIndex: (p: number) => void;
  onPlay: () => void;
  onSettings: () => void;
}

export function MobileBar(p: BarProps) {
  if (p.view === 'code') {
    return (
      <nav className="m-bar" aria-label="Run">
        <button className="m-run" onClick={p.onRun} disabled={p.running}>
          {p.running ? <Loader2 size={20} className="spin" /> : <Play size={20} fill="currentColor" />} Run
        </button>
      </nav>
    );
  }
  const disabled = p.total === 0;
  let cur = -1;
  p.chapters.forEach((c, k) => {
    if (c.pos <= p.pos) cur = k;
  });
  const label = p.chapters.length >= 2 ? (cur >= 0 ? p.chapters[cur].label : 'Getting started') : disabled ? 'Press Run in the Code tab' : 'Step by step';
  return (
    <nav className="m-bar" aria-label="Playback controls">
      <div className="m-where">
        <span className="m-chapter">{label}</span>
        <span className="m-count">{p.total ? `${p.pos + 1} / ${p.total}` : ''}</span>
      </div>
      <input
        className="m-scrub"
        type="range"
        min={0}
        max={Math.max(0, p.total - 1)}
        value={p.pos}
        disabled={disabled}
        onChange={(e) => p.onIndex(Number(e.target.value))}
        aria-label="Step"
      />
      <div className="m-controls">
        <button className="m-btn" onClick={() => p.onIndex(p.pos - 1)} disabled={disabled || p.pos === 0} aria-label="Previous step">
          <ChevronLeft size={22} /> <span>Back</span>
        </button>
        <button className="m-play" onClick={p.onPlay} disabled={disabled} aria-label={p.playing ? 'Pause' : 'Play'}>
          {p.playing ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" style={{ marginLeft: 3 }} />}
        </button>
        <button className="m-btn" onClick={() => p.onIndex(p.pos + 1)} disabled={disabled || p.pos >= p.total - 1} aria-label="Next step">
          <span>Next</span> <ChevronRight size={22} />
        </button>
        <button className="m-icon" onClick={p.onSettings} aria-label="Playback settings">
          <Settings2 size={21} />
        </button>
      </div>
    </nav>
  );
}

interface SheetProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

/** A panel that slides up from the bottom of the screen; tap outside or ✕ to close. */
export function BottomSheet({ title, onClose, children }: SheetProps) {
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [onClose]);
  return (
    <div className="m-sheet-backdrop" onClick={onClose}>
      <div className="m-sheet" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="m-sheet-head">
          <h2>{title}</h2>
          <button className="m-icon" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

interface SettingsProps {
  onClose: () => void;
  keyOnly: boolean;
  onKeyOnly: (v: boolean) => void;
  predict: boolean;
  onPredict: (v: boolean) => void;
  speed: number;
  onSpeed: (s: number) => void;
}

export function PlaybackSettings(p: SettingsProps) {
  return (
    <BottomSheet title="Playback" onClose={p.onClose}>
      <div className="m-setting">
        <div className="m-setting-label">Which steps to show</div>
        <div className="m-seg" role="tablist">
          <button role="tab" aria-selected={p.keyOnly} className={p.keyOnly ? 'active' : ''} onClick={() => p.onKeyOnly(true)}>Key steps</button>
          <button role="tab" aria-selected={!p.keyOnly} className={!p.keyOnly ? 'active' : ''} onClick={() => p.onKeyOnly(false)}>Every line</button>
        </div>
        <p className="m-setting-hint">{p.keyOnly ? 'Stops only on compares, swaps, changes and calls.' : 'Stops on every line that runs.'}</p>
      </div>
      <div className="m-setting">
        <div className="m-setting-label">Predict mode</div>
        <div className="m-seg" role="tablist">
          <button role="tab" aria-selected={!p.predict} className={!p.predict ? 'active' : ''} onClick={() => p.onPredict(false)}>Off</button>
          <button role="tab" aria-selected={p.predict} className={p.predict ? 'active' : ''} onClick={() => p.onPredict(true)}>Ask me first</button>
        </div>
        <p className="m-setting-hint">Pauses before each comparison so you can guess the answer.</p>
      </div>
      <div className="m-setting">
        <div className="m-setting-label">Speed</div>
        <div className="m-seg speeds" role="tablist">
          {SPEEDS.filter((s) => s !== 0.25 && s !== 8).map((s) => (
            <button key={s} role="tab" aria-selected={p.speed === s} className={p.speed === s ? 'active' : ''} onClick={() => p.onSpeed(s)}>{s}×</button>
          ))}
        </div>
      </div>
    </BottomSheet>
  );
}
