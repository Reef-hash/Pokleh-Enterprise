/**
 * Haptic feedback utility for native-app feel.
 *
 * Usage:
 *   import { haptic } from "@/lib/haptic";
 *   <button onClick={() => { haptic.light(); doSomething(); }}>Press</button>
 *
 * Falls back silently on unsupported devices.
 */

type FeedbackFn = () => void;

const createFeedback = (duration: number): FeedbackFn => () => {
  try {
    navigator.vibrate?.(duration);
  } catch { /* noop */ }
};

export const haptic = {
  /** Subtle tap — use for button presses, list selections. */
  light: createFeedback(10),
  /** Medium tap — use for confirmations, toggles. */
  medium: createFeedback(20),
  /** Strong feedback — use for destructive actions, errors. */
  heavy: createFeedback(40),
};
