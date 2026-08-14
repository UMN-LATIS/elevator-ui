import {
  inject,
  ref,
  toValue,
  watchEffect,
  type MaybeRefOrGetter,
  type Ref,
} from "vue";
import { onBeforeRouteLeave } from "vue-router";
import { LEAVE_GUARD } from "@/constants/constants";

export interface LeaveConfirmation {
  title: string;
  message: string;
  confirmLabel: string;
}

/** A reason to stop the admin leaving, and what to tell them about it. */
export interface NavigationBlocker {
  isBlocking: MaybeRefOrGetter<boolean>;
  confirmation: LeaveConfirmation;
}

export interface LeaveGuard {
  isConfirmingLeave: Ref<boolean>;
  activeConfirmation: Ref<LeaveConfirmation | null>;
  confirmLeave: () => void;
  cancelLeave: () => void;
  leaveWithoutConfirming: (navigate: () => Promise<unknown>) => Promise<void>;
  askBeforeLeaving: () => boolean | Promise<boolean>;
}

export const UNSAVED_CHANGES_CONFIRMATION: LeaveConfirmation = {
  title: "Unsaved changes",
  message: "Leaving this page discards the changes you have not saved.",
  confirmLabel: "Discard changes",
};

/**
 * Asks the admin to confirm before they leave a page that holds work in
 * progress, covering both in-app navigation and closing or reloading the tab.
 *
 * @param blockers - Checked in order, and the first one blocking supplies the
 * wording. Put the more specific reason first.
 *
 * @example
 * ```ts
 * const guard = useLeaveGuard([
 *   { isBlocking: () => uploadStore.hasActiveUploads, confirmation: UPLOAD },
 *   { isBlocking: () => editor.hasUnsavedChanges, confirmation: UNSAVED },
 * ]);
 * ```
 */
export function useLeaveGuard(blockers: NavigationBlocker[]): LeaveGuard {
  const isConfirmingLeave = ref(false);
  const activeConfirmation = ref<LeaveConfirmation | null>(null);
  let resolveLeave: ((isLeaveAllowed: boolean) => void) | null = null;
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

  /**
   * Whether the admin is willing to lose the work in progress. Answers true
   * outright when nothing blocks, and otherwise opens the confirmation and
   * answers once they pick.
   *
   * Route leaves get this automatically. Call it directly for a departure the
   * router does not count as one, such as a page whose own parameters change
   * to a different record.
   */
  function askBeforeLeaving(): true | Promise<boolean> {
    if (isSkippingConfirmation) return true;

    const blocker = findBlocker();
    if (!blocker) return true;

    activeConfirmation.value = blocker.confirmation;
    isConfirmingLeave.value = true;

    // The router waits on a promise, which is what lets us ask in a styled
    // dialog rather than window.confirm.
    return new Promise<boolean>((resolve) => {
      resolveLeave = resolve;
    });
  }

  onBeforeRouteLeave(askBeforeLeaving);

  function settleLeave(isLeaveAllowed: boolean): void {
    isConfirmingLeave.value = false;
    if (!resolveLeave) return;

    resolveLeave(isLeaveAllowed);
    resolveLeave = null;
  }

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

  return {
    isConfirmingLeave,
    activeConfirmation,
    confirmLeave: () => settleLeave(true),
    cancelLeave: () => settleLeave(false),
    leaveWithoutConfirming,
    askBeforeLeaving,
  };
}

/** The leave guard of the enclosing page, or null if it has none. */
export const useInjectedLeaveGuard = (): LeaveGuard | null =>
  inject(LEAVE_GUARD, null);
