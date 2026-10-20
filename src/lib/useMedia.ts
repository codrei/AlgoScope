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

/** Phones: the layout with separate Code and Watch views and controls at the bottom. */
export const PHONE_QUERY = '(max-width: 699px)';
