/**
 * Runs `saveFn` one call at a time, so each call sees the previous one's
 * effects.
 *
 * - Merges concurrent requests: at most one save pending behind the in-flight one
 * - Enforces a cooldown between saves to avoid spamming the server
 * - Fires the first save immediately (no debounce delay)
 */
export function createSaveQueue(saveFn: () => Promise<void>, cooldown = 2000) {
  let saveLoopPromise: Promise<void> | null = null;
  let hasQueuedSave = false;
  let currentSavePromise: Promise<void> | null = null;

  // one resolve/reject pair per caller waiting on the next save to finish
  const resolveCallbacks = new Set<() => void>();
  const rejectCallbacks = new Set<(error: unknown) => void>();

  async function runSaveLoop() {
    let resolveSnapshot = new Set<() => void>();
    let rejectSnapshot = new Set<(error: unknown) => void>();

    try {
      while (hasQueuedSave) {
        hasQueuedSave = false;

        // snapshot and clear, so requests arriving during the save wait for
        // the next pass rather than being settled by this one
        resolveSnapshot = new Set(resolveCallbacks);
        rejectSnapshot = new Set(rejectCallbacks);
        resolveCallbacks.clear();
        rejectCallbacks.clear();

        currentSavePromise = saveFn();
        try {
          await currentSavePromise;
        } finally {
          currentSavePromise = null;
        }
        resolveSnapshot.forEach((cb) => cb());

        await new Promise((resolve) => setTimeout(resolve, cooldown));
      }
    } catch (error) {
      // reject the saves that were snapshotted when this iteration started
      rejectSnapshot.forEach((cb) => cb(error));

      // the loop is exiting, so saves that arrived after the snapshot get
      // no future pass
      rejectCallbacks.forEach((cb) => cb(error));
      resolveCallbacks.clear();
      rejectCallbacks.clear();
      hasQueuedSave = false;
    }

    // null again, so the next request starts a fresh loop
    saveLoopPromise = null;
  }

  /** Requests a save. Resolves when that save completes, rejects if it fails. */
  function save() {
    return new Promise<void>((resolve, reject) => {
      hasQueuedSave = true;

      resolveCallbacks.add(resolve);
      rejectCallbacks.add(reject);

      if (!saveLoopPromise) {
        saveLoopPromise = runSaveLoop();
      }
    });
  }

  /**
   * Resolves once the save being sent right now has settled, successfully or
   * not, and immediately when none is in flight. Work that must not interleave
   * with a save awaits this. It does not wait out the cooldown, so it costs
   * nothing once the request itself is done.
   */
  async function waitForCurrentSaveToSettle(): Promise<void> {
    if (!currentSavePromise) return;
    // a rejected save has still settled, and runSaveLoop owns reporting it
    await Promise.allSettled([currentSavePromise]);
  }

  return { save, waitForCurrentSaveToSettle };
}
