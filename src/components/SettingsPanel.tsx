// Settings: every way to customize AlgoScope in one place, saved on this device.
// Laptops get a dialog; phones and upright tablets get a panel that slides up from the bottom.
import { Check, Download, Minus, Plus, RotateCcw, Share, X } from 'lucide-react';
import { useEffect, useId, type ReactNode } from 'react';
import { promptInstall, useInstall } from '../lib/install';
import { BottomSheet } from './MobileBar';
import { SPEEDS } from './Playback';
import type { ViewMode } from './Visualizer';

export type Theme = 'light' | 'dark' | 'system';
export type Palette = 'standard' | 'colorblind';

export interface Prefs {
  theme: Theme;
  zoom: number;
  palette: Palette;
  motion: boolean;
  mode: ViewMode;
  keyOnly: boolean;
  speed: number;
  predict: boolean;
  autoplay: boolean;
}

export const DEFAULT_PREFS: Prefs = {
  theme: 'light',
  zoom: 1,
  palette: 'standard',
  motion: true,
  mode: 'beginner',
  keyOnly: true,
  speed: 1,
  predict: false,
  autoplay: true,
};

export const ZOOM_MIN = 0.7;
export const ZOOM_MAX = 1.8;

interface Props {
  prefs: Prefs;
  onChange: <K extends keyof Prefs>(key: K, value: Prefs[K]) => void;
  /** -1 smaller, +1 bigger, 0 back to 100% */
  onZoom: (d: number) => void;
  onReset: () => void;
  onClose: () => void;
  /** touch layout (phones, upright tablets): a bottom panel, and no text size or Full detail (phones always use Focus) */
  touch: boolean;
}

/** a row of buttons where exactly one is chosen */
function Choice<T extends string | number | boolean>({ label, value, options, onChange, hint }: {
  label: string;
  value: T;
  options: [T, string][];
  onChange: (v: T) => void;
  hint?: ReactNode;
}) {
  const id = useId();
  return (
    <div className="set-row">
      <div className="set-label" id={id}>{label}</div>
      <div className="set-seg" role="radiogroup" aria-labelledby={id}>
        {options.map(([v, text]) => (
          <button key={String(v)} role="radio" aria-checked={v === value} className={v === value ? 'active' : ''} onClick={() => onChange(v)}>
            {text}
          </button>
        ))}
      </div>
      {hint && <p className="set-hint">{hint}</p>}
    </div>
  );
}

function InstallSection() {
  const s = useInstall();
  let body: ReactNode;
  if (s.standalone) {
    body = <p className="set-ok"><Check size={18} /> You are using the installed app.</p>;
  } else if (s.installed) {
    body = <p className="set-ok"><Check size={18} /> Installed. Open AlgoScope from your home screen or your list of apps.</p>;
  } else if (s.canPrompt) {
    body = (
      <button className="set-install" onClick={() => promptInstall()}>
        <Download size={18} /> Install AlgoScope
      </button>
    );
  } else if (s.platform === 'ios') {
    body = (
      <ol className="set-steps">
        <li>Tap <b>Share</b> <Share size={15} aria-label="(the square with an arrow)" />. In Safari it is at the bottom of the screen on an iPhone and at the top on an iPad.</li>
        <li>Scroll down and tap <b>Add to Home Screen</b>.</li>
        <li>Tap <b>Add</b>.</li>
      </ol>
    );
  } else if (s.platform === 'android') {
    body = (
      <ol className="set-steps">
        <li>Open the browser menu <b>⋮</b>.</li>
        <li>Tap <b>Install app</b> or <b>Add to Home screen</b>.</li>
      </ol>
    );
  } else if (s.platform === 'mac-safari') {
    body = (
      <ol className="set-steps">
        <li>In Safari&rsquo;s menu bar choose <b>File → Add to Dock…</b></li>
        <li>Click <b>Add</b>.</li>
      </ol>
    );
  } else {
    body = (
      <>
        <ol className="set-steps">
          <li>Open AlgoScope in <b>Chrome</b> or <b>Edge</b>.</li>
          <li>Click the install icon at the right end of the address bar, or open the browser menu and choose <b>Install AlgoScope</b> (Chrome: under <i>Cast, save and share</i>; Edge: under <i>Apps</i>).</li>
        </ol>
        <p className="set-hint">Firefox can&rsquo;t install websites as apps, but AlgoScope still works there without internet after the first visit.</p>
      </>
    );
  }
  return (
    <section className="set-section" aria-labelledby="set-install-title">
      <h3 id="set-install-title">Install as an app</h3>
      <p className="set-hint">Put AlgoScope on your home screen or computer. It opens in its own window, like an app, and works without internet once it has loaded.</p>
      {body}
      <p className="set-hint">
        Teachers: a copy to put on a school web server is on the{' '}
        <a href="https://github.com/codrei/AlgoScope/releases/latest" target="_blank" rel="noreferrer">Releases page</a>.
      </p>
    </section>
  );
}

export function SettingsPanel({ prefs, onChange, onZoom, onReset, onClose, touch }: Props) {
  useEffect(() => {
    if (touch) return; // the bottom panel closes on Esc by itself
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [onClose, touch]);

  const speeds = touch ? SPEEDS.filter((s) => s !== 0.25 && s !== 8) : SPEEDS;
  // laptops: the look first (text size for the projector); phones: playback first (the ⚙ in the bottom bar)
  const watch = (
      <section className="set-section" aria-labelledby="set-watch-title">
        <h3 id="set-watch-title">Watching a run</h3>
        {!touch && (
          <Choice
            label="How much to show"
            value={prefs.mode}
            options={[['beginner', 'Focus'], ['detailed', 'Full detail']]}
            onChange={(v) => onChange('mode', v)}
            hint={prefs.mode === 'beginner' ? 'The main picture, the explanation and the variables.' : 'Adds the counters, the call stack, the Big-O badges and every array.'}
          />
        )}
        <Choice
          label="Which steps to show"
          value={prefs.keyOnly}
          options={[[true, 'Key steps'], [false, 'Every line']]}
          onChange={(v) => onChange('keyOnly', v)}
          hint={prefs.keyOnly ? 'Stops only on compares, swaps, changes and calls.' : 'Stops on every line that runs.'}
        />
        <Choice label="Speed" value={prefs.speed} options={speeds.map((s) => [s, `${s}×`])} onChange={(v) => onChange('speed', v)} />
        <Choice
          label="After Run"
          value={prefs.autoplay}
          options={[[true, 'Play right away'], [false, 'Wait for me']]}
          onChange={(v) => onChange('autoplay', v)}
          hint={prefs.autoplay ? 'The run starts playing by itself.' : 'The run stops on the first step until you press Play or Next.'}
        />
        <Choice
          label="Predict mode"
          value={prefs.predict}
          options={[[false, 'Off'], [true, 'Ask me first']]}
          onChange={(v) => onChange('predict', v)}
          hint="Pauses before each comparison so you (or the class) can guess the answer."
        />
      </section>
  );
  const look = (
      <section className="set-section" aria-labelledby="set-look-title">
        <h3 id="set-look-title">Look</h3>
        <Choice
          label="Theme"
          value={prefs.theme}
          options={[['light', 'Light'], ['dark', 'Dark'], ['system', 'Same as device']]}
          onChange={(v) => onChange('theme', v)}
          hint={prefs.theme === 'dark' ? 'Dark often looks better on projectors that wash out colors.' : undefined}
        />
        {!touch && (
          <div className="set-row">
            <div className="set-label" id="set-size-label">Text size</div>
            <div className="set-size" role="group" aria-labelledby="set-size-label">
              <button className="set-step" onClick={() => onZoom(-1)} disabled={prefs.zoom <= ZOOM_MIN} aria-label="Smaller text">
                <Minus size={18} />
              </button>
              <output className="set-size-value" aria-live="polite">{Math.round(prefs.zoom * 100)}%</output>
              <button className="set-step" onClick={() => onZoom(1)} disabled={prefs.zoom >= ZOOM_MAX} aria-label="Bigger text">
                <Plus size={18} />
              </button>
              {prefs.zoom !== 1 && (
                <button className="set-link" onClick={() => onZoom(0)}>Back to 100%</button>
              )}
            </div>
            <p className="set-hint">Makes the code and the picture bigger, for projectors and the back row.</p>
          </div>
        )}
        <Choice
          label="Colors"
          value={prefs.palette}
          options={[['standard', 'Standard'], ['colorblind', 'Color-blind friendly']]}
          onChange={(v) => onChange('palette', v)}
          hint={
            <>
              <span className="legend set-legend" aria-hidden="true">
                <span><i className="compare" /> compared</span>
                <span><i className="swap" /> swapped</span>
                <span><i className="write" /> changed</span>
                <span><i className="locked" /> locked</span>
              </span>
              {prefs.palette === 'colorblind' && <>Colors that stay easy to tell apart with red–green or blue–yellow color blindness.</>}
            </>
          }
        />
        <Choice
          label="Animations"
          value={prefs.motion}
          options={[[true, 'On'], [false, 'Off']]}
          onChange={(v) => onChange('motion', v)}
          hint={prefs.motion ? 'Values slide to their new place.' : 'Values jump to their new place, with no movement.'}
        />
      </section>
  );
  const body = (
    <div className="settings-body">
      {touch ? <>{watch}{look}</> : <>{look}{watch}</>}
      <InstallSection />

      <div className="set-footer">
        <span className="set-hint">Settings are saved on this device.</span>
        <button className="ghost-btn set-reset" onClick={onReset}>
          <RotateCcw size={15} /> Reset all settings
        </button>
      </div>
    </div>
  );

  if (touch) {
    return (
      <BottomSheet title="Settings" onClose={onClose}>
        {body}
      </BottomSheet>
    );
  }
  return (
    <div className="dialog-backdrop" onMouseDown={onClose}>
      <div className="dialog settings" role="dialog" aria-modal="true" aria-labelledby="settings-title" onMouseDown={(e) => e.stopPropagation()}>
        <button className="ghost-btn dialog-close" onClick={onClose} aria-label="Close">
          <X size={16} />
        </button>
        <h2 id="settings-title">Settings</h2>
        {body}
      </div>
    </div>
  );
}
