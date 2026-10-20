import { useEffect, type RefObject } from 'react';

/**
 * Moves the keyboard focus into a dialog when it opens, and back to the button that opened it when it
 * closes, so keyboard users start inside the panel instead of on the page behind it.
 */
export function useDialogFocus(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const before = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    ref.current?.focus({ preventScroll: true });
    return () => before?.focus({ preventScroll: true });
  }, [ref]);
}
