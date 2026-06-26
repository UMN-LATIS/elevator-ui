// Resolve the element to focus: a CSS selector or a function returning one.
type FocusTarget = string | (() => HTMLElement | null | undefined);

type TryFocusOptions = {
  // How many animation frames to keep retrying before giving up.
  maxAttempts?: number;
};

// Focus an element that may not be ready the instant we ask. A freshly
// rendered element can mount a few frames late (async data, open
// transitions) and isn't always focusable the moment it appears, so retry on
// animation frames until focus actually lands. Resolves with the focused
// element; rejects if it never takes — a rejection is a real signal worth
// surfacing, not a silent no-op.
export function tryFocus(
  target: FocusTarget,
  { maxAttempts = 10 }: TryFocusOptions = {}
): Promise<HTMLElement> {
  const resolveTarget = (): HTMLElement | null =>
    typeof target === "string"
      ? document.querySelector<HTMLElement>(target)
      : (target() ?? null);

  return new Promise((resolve, reject) => {
    let attemptsLeft = maxAttempts;

    const attempt = () => {
      const element = resolveTarget();
      if (element) {
        element.focus();
        // focus() no-ops on an element that isn't focusable yet, so confirm
        // it landed before we call it done
        if (document.activeElement === element) {
          resolve(element);
          return;
        }
      }

      if (attemptsLeft > 0) {
        attemptsLeft -= 1;
        requestAnimationFrame(attempt);
      } else {
        const label = typeof target === "string" ? target : "element";
        reject(new Error(`tryFocus: gave up on "${label}" after ${maxAttempts} frames`));
      }
    };

    attempt();
  });
}
