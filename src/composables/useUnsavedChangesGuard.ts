import {
  ref,
  toValue,
  watchEffect,
  type MaybeRefOrGetter,
  type Ref,
} from "vue";
import { onBeforeRouteLeave } from "vue-router";

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

export interface UnsavedChangesGuard {
  isConfirmingLeave: Ref<boolean>;
  activeConfirmation: Ref<LeaveConfirmation | null>;
  confirmLeave: () => void;
  cancelLeave: () => void;
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
 * Only guards leaving the route. Navigating between two assets on one route
 * does not prompt, because the asset editor reaches the second asset by
 * replacing its own route parameters after a successful save.
 *
 * @param blockers - Checked in order, and the first one blocking supplies the
 * wording. Put the more specific reason first.
 *
 * @example
 * ```ts
 * const guard = useUnsavedChangesGuard([
 *   { isBlocking: () => uploadStore.hasActiveUploads, confirmation: UPLOAD },
 *   { isBlocking: () => editor.hasUnsavedChanges, confirmation: UNSAVED },
 * ]);
 * ```
 */
export function useUnsavedChangesGuard(
  blockers: NavigationBlocker[]
): UnsavedChangesGuard {
  const isConfirmingLeave = ref(false);
  const activeConfirmation = ref<LeaveConfirmation | null>(null);
  let resolveLeave: ((isLeaveAllowed: boolean) => void) | null = null;

  function findBlocker(): NavigationBlocker | null {
    return blockers.find((blocker) => toValue(blocker.isBlocking)) ?? null;
  }

  watchEffect((onCleanup) => {
    if (!findBlocker()) return;

    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      // Browsers show their own wording and ignore anything we return.
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warnBeforeUnload);

    // onCleanup rather than onUnmounted: the listener has to come off as soon
    // as nothing is blocking, and watchEffect cleans up before every re-run.
    onCleanup(() =>
      window.removeEventListener("beforeunload", warnBeforeUnload)
    );
  });

  onBeforeRouteLeave(() => {
    const blocker = findBlocker();
    if (!blocker) return true;

    activeConfirmation.value = blocker.confirmation;
    isConfirmingLeave.value = true;

    // The router waits on a promise, which is what lets us ask in a styled
    // dialog rather than window.confirm.
    return new Promise<boolean>((resolve) => {
      resolveLeave = resolve;
    });
  });

  function settleLeave(isLeaveAllowed: boolean): void {
    isConfirmingLeave.value = false;
    if (!resolveLeave) return;

    resolveLeave(isLeaveAllowed);
    resolveLeave = null;
  }

  return {
    isConfirmingLeave,
    activeConfirmation,
    confirmLeave: () => settleLeave(true),
    cancelLeave: () => settleLeave(false),
  };
}
