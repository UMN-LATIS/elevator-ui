/**
 * - prevents race which could result in duplicate asset creation. Serializes saves so the `assetId` from a CREATE is always written back before the next save reads it.
 * - Coalesces concurrent requests: at most one save pending behind the in-flight one
 * - Enforces a cooldown between saves to avoid spamming the server
 * - Fires the first save immediately (no debounce delay)
 */
export function createSaveQueue(saveFn: () => Promise<void>, cooldown = 2000) {
  // promise of the running save loop
  let saveLoopPromise: Promise<void> | null = null;

  // should save again after this save finishes
  let hasPendingSave = false;

  // as each save is requested, we'll add its promised
  // resolve/reject to these sets, and call them when
  // the next save finishes
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
        // reset the flag
        hasPendingSave = false;

        // snapshot the current callbacks and clear the sets,
        // so new requests can come in while we're saving
        resolveSnapshot = new Set(resolveCallbacks);
        rejectSnapshot = new Set(rejectCallbacks);
        resolveCallbacks.clear();
        rejectCallbacks.clear();

        // run the save
        await saveFn();

        // if it succeeds, resolve all pending promises
        resolveSnapshot.forEach((cb) => cb());

        // wait a bit before the next save, to avoid spamming saves if the user is making rapid changes
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

    // when the loop finishes, reset the promise
    saveLoopPromise = null;
  }

  /**
   * Requests a save. If a save is already in progress, it will be
   * - If the save loop is not running, start it.
   * - If it is, just set the pending flag to signal we
   *  need to save again after the current save finishes.
   *
   * @returns a promise that resolves when the save completes, or rejects if it fails
   */
  async function save() {
    return new Promise<void>((resolve, reject) => {
      hasPendingSave = true;

      resolveCallbacks.add(resolve);
      rejectCallbacks.add(reject);

      if (!saveLoopPromise) {
        saveLoopPromise = runSaveLoop();
      }

      return saveLoopPromise;
    });
  }

  return { save };
}
