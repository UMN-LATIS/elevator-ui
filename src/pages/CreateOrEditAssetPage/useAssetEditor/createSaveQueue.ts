/**
 * Runs `saveFn` one call at a time, so each call sees the previous one's
 * effects.
 *
 * - Coalesces concurrent requests: at most one save pending behind the in-flight one
 * - Enforces a cooldown between saves to avoid spamming the server
 * - Fires the first save immediately (no debounce delay)
 */
export function createSaveQueue(saveFn: () => Promise<void>, cooldown = 2000) {
  let saveLoopPromise: Promise<void> | null = null;
  let hasPendingSave = false;
  let currentSavePromise: Promise<void> | null = null;

  // one resolve/reject pair per caller waiting on the next save to finish
  const resolveCallbacks = new Set<() => void>();
  const rejectCallbacks = new Set<(error: unknown) => void>();

  /**
   * Processes save requests until there are no more
   * pending saves.
   */
  async function runSaveLoop() {
    let resolveSnapshot = new Set<() => void>();
    let rejectSnapshot = new Set<(error: unknown) => void>();

    try {
      while (hasPendingSave) {
        hasPendingSave = false;

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

        // cooldown, so rapid edits do not each cost a request
        await new Promise((resolve) => setTimeout(resolve, cooldown));
      }
    } catch (error) {
      // reject the saves that were snapshotted when this iteration started
      rejectSnapshot.forEach((cb) => cb(error));

      // also reject any saves that arrived while saveFn() was awaiting —
      // they were added after the snapshot was taken and won't be picked up
      // by a future iteration because the loop is exiting
      rejectCallbacks.forEach((cb) => cb(error));
      resolveCallbacks.clear();
      rejectCallbacks.clear();
      hasPendingSave = false;
    }

    // null again, so the next request starts a fresh loop
    saveLoopPromise = null;
  }

  /**
   * Requests a save. If the save loop is not running, start it.
   * If it is already running, set the pending flag to signal we
   * need to save again after the current save finishes.
   *
   * @returns a promise that resolves when the save completes, or rejects if it fails
   */
  function save() {
    return new Promise<void>((resolve, reject) => {
      hasPendingSave = true;

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
    // a rejected save still settles, and runSaveLoop owns reporting it
    await currentSavePromise?.catch(() => {});
  }

  return { save, waitForCurrentSaveToSettle };
}
