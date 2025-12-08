// fire off a callback when all images inside a container are loaded
// Returns a cleanup function to remove event listeners and cancel the operation
export function onAllImagesLoaded(
  selector: string,
  onComplete: (images: HTMLImageElement[]) => void,
  opts: { timeout?: number } = {}
): () => void {
  const { timeout = 10_000 } = opts;

  const container = document.querySelector(selector);
  if (!container) {
    throw new Error(`Container not found: ${selector}`);
  }

  const images = Array.from(container.querySelectorAll("img"));
  const abortController = new AbortController();
  let completed = false;

  const handleComplete = () => {
    if (completed) return;
    completed = true;
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
  const timeoutId = setTimeout(handleComplete, timeout);

  return () => {
    clearTimeout(timeoutId);
    abortController.abort();
  };
}
