import { computed, ref, type ComputedRef } from "vue";

export interface SavedSnapshot {
  hasUnsavedChanges: ComputedRef<boolean>;
  markAsSaved: () => void;
}

/**
 * Reports whether an editor's current values still match what was last saved.
 *
 * The caller keeps owning its form state and passes a getter, so an editor
 * whose editable values span more than one ref can compare all of them.
 * Call `markAsSaved` after seeding the form from the server and again after
 * every successful save.
 *
 * @param currentValue - Reads every value the editor considers editable.
 *
 * @example
 * ```ts
 * const form = ref(makeEmptyForm());
 * const { hasUnsavedChanges, markAsSaved } = useSavedSnapshot(() => form.value);
 *
 * saveMutation.mutate(form.value, {
 *   onSuccess: () => {
 *     markAsSaved();
 *     router.push({ name: "index" });
 *   },
 * });
 * ```
 */
export function useSavedSnapshot(currentValue: () => unknown): SavedSnapshot {
  // Whatever the editor holds at setup is the baseline, which is what makes
  // an untouched create form read as saved without the caller doing anything.
  const savedValue = ref(JSON.stringify(currentValue()));

  return {
    hasUnsavedChanges: computed(
      () => JSON.stringify(currentValue()) !== savedValue.value
    ),
    markAsSaved: () => {
      savedValue.value = JSON.stringify(currentValue());
    },
  };
}
