import { ChevronLeft, ChevronRight, Pause, Play, SkipBack, SkipForward } from 'lucide-react';

export const SPEEDS = [0.25, 0.5, 1, 1.5, 2, 4, 8];

interface Props {
  index: number;
  total: number;
  playing: boolean;
  speed: number;
  onIndex: (i: number) => void;
  onPlay: () => void;
  onSpeed: (s: number) => void;
}

export function Playback({ index, total, playing, speed, onIndex, onPlay, onSpeed }: Props) {
  const disabled = total === 0;
  const atEnd = index >= total - 1;
  return (
    <div className="playback" aria-label="Playback controls">
      <button className="pb-btn" onClick={() => onIndex(0)} disabled={disabled || index === 0} title="First step (Home)" aria-label="First step">
        <SkipBack size={17} />
      </button>
      <button className="pb-btn" onClick={() => onIndex(index - 1)} disabled={disabled || index === 0} title="Previous step (←)" aria-label="Previous step">
        <ChevronLeft size={20} />
      </button>
      <button className="pb-btn play" onClick={onPlay} disabled={disabled} title={playing ? 'Pause (Space)' : 'Play (Space)'} aria-label={playing ? 'Pause' : 'Play'}>
        {playing ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" style={{ marginLeft: 2 }} />}
      </button>
      <button className="pb-btn" onClick={() => onIndex(index + 1)} disabled={disabled || atEnd} title="Next step (→)" aria-label="Next step">
        <ChevronRight size={20} />
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
      <select className="speed" value={speed} onChange={(e) => onSpeed(Number(e.target.value))} aria-label="Speed" title="Playback speed">
        {SPEEDS.map((s) => (
          <option key={s} value={s}>{s}×</option>
        ))}
      </select>
    </div>
  );
}
