import { ChevronLeft, ChevronRight, HelpCircle, Pause, Play, SkipBack, SkipForward } from 'lucide-react';

/** The parts of the algorithm as a strip of segments: where am I, and jump to any part. */
export function ChapterBar({ chapters, pos, total, onJump, onStep }: {
  chapters: { pos: number; label: string }[];
  pos: number;
  total: number;
  onJump: (pos: number) => void;
  onStep: (dir: 1 | -1) => void;
}) {
  let cur = -1;
  chapters.forEach((c, k) => {
    if (c.pos <= pos) cur = k;
  });
  const name = cur >= 0 ? chapters[cur].label : 'Getting started';
  return (
    <div className="chapters" aria-label="Parts of the algorithm">
      <button className="ch-btn" onClick={() => onStep(-1)} disabled={pos === 0} title="Previous part (Page Up)" aria-label="Previous part">
        <ChevronLeft size={16} />
      </button>
      <div className="ch-name" aria-live="polite">
        <b>{name}</b>
        <small>part {Math.max(1, cur + 1)} of {chapters.length}</small>
      </div>
      <div className="ch-track">
        {chapters.map((c, k) => {
          const end = chapters[k + 1]?.pos ?? total;
          return (
            <button
              key={`${c.pos}-${k}`}
              className={`ch-seg ${k < cur ? 'done' : k === cur ? 'current' : ''}`}
              style={{ flexGrow: Math.max(1, end - c.pos) }}
              onClick={() => onJump(c.pos)}
              title={c.label}
              aria-label={`Go to ${c.label}`}
            />
          );
        })}
      </div>
      <button className="ch-btn" onClick={() => onStep(1)} disabled={cur >= chapters.length - 1} title="Next part (Page Down)" aria-label="Next part">
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

export const SPEEDS = [0.25, 0.5, 1, 1.5, 2, 4, 8];

interface Props {
  index: number;
  total: number;
  playing: boolean;
  speed: number;
  onIndex: (i: number) => void;
  onPlay: () => void;
  onSpeed: (s: number) => void;
  keyOnly: boolean;
  onKeyOnly: (v: boolean) => void;
  predict: boolean;
  onPredict: (v: boolean) => void;
}

export function Playback({ index, total, playing, speed, onIndex, onPlay, onSpeed, keyOnly, onKeyOnly, predict, onPredict }: Props) {
  const disabled = total === 0;
  const atEnd = index >= total - 1;
  return (
    <div className="playback" aria-label="Playback controls">
      <button className="pb-btn" onClick={() => onIndex(0)} disabled={disabled || index === 0} title="First step (Home)" aria-label="First step">
        <SkipBack size={17} />
      </button>
      <button className="pb-btn labeled" onClick={() => onIndex(index - 1)} disabled={disabled || index === 0} title="Previous step (←)" aria-label="Previous step">
        <ChevronLeft size={19} /> <span>Back</span>
      </button>
      <button className="pb-btn play" onClick={onPlay} disabled={disabled} title={playing ? 'Pause (Space)' : 'Play (Space)'} aria-label={playing ? 'Pause' : 'Play'}>
        {playing ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" style={{ marginLeft: 2 }} />}
      </button>
      <button className="pb-btn labeled" onClick={() => onIndex(index + 1)} disabled={disabled || atEnd} title="Next step (→)" aria-label="Next step">
        <span>Next</span> <ChevronRight size={19} />
      </button>
      <button className="pb-btn" onClick={() => onIndex(total - 1)} disabled={disabled || atEnd} title="Last step (End)" aria-label="Last step">
        <SkipForward size={17} />
      </button>
      <input
        className="scrub"
        type="range"
        min={0}
        max={Math.max(0, total - 1)}
        value={index}
        disabled={disabled}
        onChange={(e) => onIndex(Number(e.target.value))}
        aria-label="Step"
      />
      <span className="step-count">{total ? `${index + 1} / ${total}` : '0 / 0'}</span>
      <div className="seg step-mode" role="tablist" aria-label="Which steps to show">
        <button role="tab" aria-selected={keyOnly} className={keyOnly ? 'active' : ''} onClick={() => onKeyOnly(true)} title="Stop only on compares, swaps, changes and calls">
          Key steps
        </button>
        <button role="tab" aria-selected={!keyOnly} className={!keyOnly ? 'active' : ''} onClick={() => onKeyOnly(false)} title="Stop on every line that runs">
          Every line
        </button>
      </div>
      <button
        className={`predict-btn ${predict ? 'active' : ''}`}
        onClick={() => onPredict(!predict)}
        aria-pressed={predict}
        title="Predict mode: pause before each comparison so the class can guess the answer"
      >
        <HelpCircle size={15} /> Predict
      </button>
      <select className="speed" value={speed} onChange={(e) => onSpeed(Number(e.target.value))} aria-label="Speed" title="Playback speed">
        {SPEEDS.map((s) => (
          <option key={s} value={s}>{s}×</option>
        ))}
      </select>
    </div>
  );
}
