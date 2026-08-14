import { toValue, watchEffect, type MaybeRefOrGetter } from "vue";
import { onBeforeRouteLeave, onBeforeRouteUpdate } from "vue-router";
import { equals } from "ramda";

/** A reason to stop the admin leaving, and what to tell them about it. */
export interface NavigationBlocker {
  isBlocking: MaybeRefOrGetter<boolean>;

  /**
   * Ends in a question, because the browser labels the buttons OK and Cancel
   * and nothing else tells the admin which one leaves.
   */
  message: string;
}

export interface LeaveGuard {
  leaveWithoutConfirming: (navigate: () => Promise<unknown>) => Promise<void>;
}

export const UNSAVED_CHANGES_MESSAGE =
  "Leaving this page discards the changes you have not saved. Leave anyway?";

/**
 * Asks the admin to confirm before work in progress is discarded, covering
 * every way that can happen: leaving the route, staying on the route while its
 * parameters change to a different record, and closing or reloading the tab.
 *
 * @param blockers - Checked in order, and the first one blocking supplies the
 * wording. Put the more specific reason first.
 *
 * @example
 * ```ts
 * const guard = useLeaveGuard([
 *   { isBlocking: () => uploadStore.hasActiveUploads, message: UPLOAD },
 *   { isBlocking: () => editor.hasUnsavedChanges, message: UNSAVED_CHANGES_MESSAGE },
 * ]);
 * ```
 */
export function useLeaveGuard(blockers: NavigationBlocker[]): LeaveGuard {
  let isSkippingConfirmation = false;

  function findBlocker(): NavigationBlocker | null {
    return blockers.find((blocker) => toValue(blocker.isBlocking)) ?? null;
  }

  watchEffect((onCleanup) => {
    if (!findBlocker()) return;

    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      // Show the browser's own leave prompt.
      // Browsers ignore any message we return, so there is nothing to word.
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warnBeforeUnload);

    // Drop the listener as soon as nothing blocks, not only on unmount,
    // so that a page which becomes clean stops warning.
    // onCleanup runs before every re-run, which onUnmounted would not.
    onCleanup(() =>
      window.removeEventListener("beforeunload", warnBeforeUnload)
    );
  });

  function guardNavigation(): boolean {
    if (isSkippingConfirmation) return true;

    const blocker = findBlocker();
    return !blocker || window.confirm(blocker.message);
  }

  onBeforeRouteLeave(guardNavigation);

  // A page whose parameters change to a different record has left the record
  // it was editing, whatever the router calls the navigation. Query and hash
  // live outside params, so a link that only adds one passes through.
  onBeforeRouteUpdate(
    (to, from) => equals(to.params, from.params) || guardNavigation()
  );

  /**
   * Navigates away without asking, for a departure that already settled the
   * work in progress: the admin just saved it, or deleted the thing it
   * belonged to.
   *
   * The bypass lasts exactly as long as the navigation, so it cannot leak
   * into the next one.
   */
  async function leaveWithoutConfirming(
    navigate: () => Promise<unknown>
  ): Promise<void> {
    isSkippingConfirmation = true;
    try {
      await navigate();
    } finally {
      isSkippingConfirmation = false;
    }
  }

  return { leaveWithoutConfirming };
}
