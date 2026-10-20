// Installing AlgoScope as an app (home screen on phones, its own window on computers).
// Chrome, Edge and Android browsers announce that the app can be installed with a
// `beforeinstallprompt` event; we keep it so the Install button can open the browser's dialog.
// Safari (iPhone, iPad, Mac) and Firefox have no such event, so Settings explains their menu instead.
import { useSyncExternalStore } from 'react';

interface InstallEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export type Platform = 'ios' | 'android' | 'mac-safari' | 'desktop';

export interface InstallState {
  /** the browser can show its install dialog right now */
  canPrompt: boolean;
  /** installed in this visit */
  installed: boolean;
  /** this page is the installed app (opened from the home screen or its own window) */
  standalone: boolean;
  platform: Platform;
}

let deferred: InstallEvent | null = null;
let installed = false;
const subs = new Set<() => void>();
const notify = () => {
  snapshot = read();
  subs.forEach((f) => f());
};

function platform(): Platform {
  const ua = navigator.userAgent;
  // iPadOS reports itself as a Mac; a Mac has no touch screen
  if (/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return 'ios';
  if (/Android/.test(ua)) return 'android';
  if (/Macintosh/.test(ua) && /Safari\//.test(ua) && !/Chrome\/|Chromium\/|Edg\/|Firefox\//.test(ua)) return 'mac-safari';
  return 'desktop';
}

function isStandalone(): boolean {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.matchMedia?.('(display-mode: window-controls-overlay)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function read(): InstallState {
  return { canPrompt: !!deferred, installed, standalone: isStandalone(), platform: platform() };
}

let snapshot: InstallState = typeof window === 'undefined' ? { canPrompt: false, installed: false, standalone: false, platform: 'desktop' } : read();

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e as InstallEvent;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    installed = true;
    notify();
  });
}

/** Opens the browser's install dialog. true if the app was installed. */
export async function promptInstall(): Promise<boolean> {
  const e = deferred;
  if (!e) return false;
  // the browser's event can be used only once
  deferred = null;
  await e.prompt();
  const { outcome } = await e.userChoice;
  if (outcome === 'accepted') installed = true;
  notify();
  return outcome === 'accepted';
}

export function useInstall(): InstallState {
  return useSyncExternalStore(
    (f) => {
      subs.add(f);
      return () => subs.delete(f);
    },
    () => snapshot,
  );
}
