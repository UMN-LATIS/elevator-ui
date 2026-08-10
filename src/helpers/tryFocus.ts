type Maybe<T> = T | null | undefined;
type CSSSelector = string;
type FocusTarget = CSSSelector | (() => Maybe<HTMLElement>);

type TryFocusOptions = {
  maxAttempts?: number; // num of animation frames
};

/**
 *  Focus an element that may not be ready the instant we ask.
 *
 *  Don't scroll here. Both engines reveal a focused element on their own,
 *  Chromium during focus() and Safari a few frames later. A scrollIntoView
 *  call placed right after focus() overrides Safari's, and `nearest` leaves
 *  the element flush against the viewport edge, where a later height change
 *  pushes it back out of view. See issue 628.
 */
export function tryFocus(
  target: FocusTarget,
  { maxAttempts = 10 }: TryFocusOptions = {}
): Promise<HTMLElement> {
  const resolveTarget = (): Maybe<HTMLElement> =>
    typeof target === "string"
      ? document.querySelector<HTMLElement>(target)
      : target();

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
        reject(
          new Error(
            `tryFocus: gave up on "${label}" after ${maxAttempts} frames`
          )
        );
      }
    };

    attempt();
  });
}
