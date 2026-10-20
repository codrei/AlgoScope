import { useEffect, useState } from 'react';

/** true while the CSS media query matches (updates on resize and rotation) */
export function useMediaQuery(query: string): boolean {
  const get = () => typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia(query).matches;
  const [match, setMatch] = useState(get);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setMatch(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, [query]);
  return match;
}

/** Phones: narrow screens. */
export const PHONE_QUERY = '(max-width: 699px)';

/**
 * The touch layout (separate Code and Watch views, controls at the bottom): phones, and tablets
 * held upright. A laptop window is never in it unless it is as narrow as a phone.
 */
export const COMPACT_QUERY = '(max-width: 699px), (max-width: 1100px) and (orientation: portrait) and (pointer: coarse)';
