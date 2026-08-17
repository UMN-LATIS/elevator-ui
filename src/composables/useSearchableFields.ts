import { useInstanceNavQuery } from "@/queries/useInstanceNavQuery";
import { ApiInstanceNavResponse, SearchableSpecificField } from "@/types";
import { computed, MaybeRefOrGetter, toValue } from "vue";

function selectSearchableFields(
  data: ApiInstanceNavResponse | undefined
): SearchableSpecificField[] {
  const sortableFields = data?.sortableFields || {};

  return Object.entries(sortableFields).map(([fieldId, field]) => ({
    ...field,
    id: fieldId,
  }));
}

/**
 * Fields the advanced search form can filter assets by.
 *
 * The API names these `sortableFields`; this app only uses them for
 * search filters, so the composable renames them on the way out.
 */
export function useSearchableFields() {
  const { data: instanceNavData } = useInstanceNavQuery();

  const searchableFields = computed((): SearchableSpecificField[] =>
    selectSearchableFields(instanceNavData.value)
  );

  const searchableFieldLookup = computed(() => {
    const fields = searchableFields.value;
    return fields.reduce((acc, field) => {
      acc[field.id] = field;
      return acc;
    }, {} as Record<string, SearchableSpecificField>);
  });

  function getSearchableField<
    T extends SearchableSpecificField = SearchableSpecificField
  >(fieldId: string): SearchableSpecificField | null {
    return (searchableFieldLookup.value[fieldId] as T) ?? null;
  }

  return {
    searchableFields,
    getSearchableField,
  };
}
