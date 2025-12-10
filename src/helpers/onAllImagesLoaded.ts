/**
 * Fires a callback when all images inside a container are loaded or errored.
 *
 * @param selector - CSS selector for the container element.
 * @param onComplete - Callback invoked with all HTMLImageElement instances when complete.
 * @param opts.timeout - Maximum time to wait in milliseconds (default: 10000).
 * @returns Cleanup function to cancel the operation and remove event listeners.
 *
 * @remarks
 * - If no images are present, fires immediately.
 * - Images that fail to load (404, network errors) are treated as "complete".
 * - If timeout is reached, fires with whatever images have been found.
 * - Throws if container element is not found (ensure cleanup is called on unmount).
 */
export function onAllImagesLoaded(
  selector: string,
  onComplete: (images: HTMLImageElement[]) => void,
  opts: { timeout?: number } = {}
): () => void {
  const { timeout = 10_000 } = opts;

  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let rafId: number | null = null;
  const abortController = new AbortController();
  let completed = false;

  const setupImageHandlers = () => {
    const container = document.querySelector(selector);
    if (!container) {
      console.warn(
        `onAllImagesLoaded: Container element not found for selector "${selector}"`
      );
      // Container was removed before we could set up handlers
      // Don't call onComplete in this case
      return;
    }

    const images = Array.from(container.querySelectorAll("img"));

    const handleComplete = () => {
      if (completed) return;
      completed = true;
      if (timeoutId !== null) clearTimeout(timeoutId);
      abortController.abort(); // Remove all listeners at once
      onComplete(images);
    };

    // Create a promise for each image
    Promise.all(
      images.map((img) => {
        if (img.complete) return Promise.resolve();

        return new Promise<void>((resolve) => {
          const load = () => resolve();
          const error = () => resolve();

          img.addEventListener("load", load, {
            signal: abortController.signal,
            once: true,
          });
          img.addEventListener("error", error, {
            signal: abortController.signal,
            once: true,
          });
        });
      })
    ).then(handleComplete);

    // Timeout fallback
    timeoutId = setTimeout(handleComplete, timeout);
  };

  // Wait for next animation frame to ensure v-html and other dynamic content is rendered. Awaiting `nextTick` is not sufficient.
  rafId = requestAnimationFrame(setupImageHandlers);

  return () => {
    if (timeoutId !== null) clearTimeout(timeoutId);
    if (rafId !== null) cancelAnimationFrame(rafId);
    abortController.abort();
  };
}
