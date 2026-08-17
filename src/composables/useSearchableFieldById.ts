import { computed, MaybeRefOrGetter, toValue } from "vue";
import { SearchableSpecificField } from "@/types";
import { useSearchableFields } from "./useSearchableFields";

/**
 * Looks up one searchable field by id, reactively.
 *
 * The type parameter narrows to a field subtype as an unchecked cast:
 * the caller asserts the subtype, the lookup does not verify `field.type`.
 * @returns null while the instance nav query is loading or if no field
 * has the given id.
 */
export function useSearchableFieldById<
  T extends SearchableSpecificField = SearchableSpecificField
>(fieldIdRef: MaybeRefOrGetter<string>) {
  const { searchableFieldLookup } = useSearchableFields();

  const searchableField = computed(
    (): T | null =>
      (searchableFieldLookup.value[toValue(fieldIdRef)] as T) ?? null
  );

  return { searchableField };
}
