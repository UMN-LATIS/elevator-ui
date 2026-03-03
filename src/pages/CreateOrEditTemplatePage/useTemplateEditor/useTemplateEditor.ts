import {
  reactive,
  computed,
  watch,
  ref,
  type InjectionKey,
  type Ref,
  MaybeRefOrGetter,
  toValue,
} from "vue";
import {
  useAdminTemplateQuery,
  useCreateTemplateMutation,
  useUpdateTemplateMutation,
} from "@/queries/useTemplateQuery";
import { FIELD_TYPE_IDS } from "@/constants/constants";
import type {
  AdminTemplate,
  AdminWidgetDef,
  AdminWidgetPayload,
  TemplatePayload,
} from "@/types";

function adminWidgetToPayload(w: AdminWidgetDef): AdminWidgetPayload {
  return {
    widgetId: w.widgetId,
    fieldTitle: w.fieldTitle ?? "",
    fieldTypeId: w.fieldTypeId,
    label: w.label,
    tooltip: w.tooltip,
    templateOrder: w.templateOrder,
    viewOrder: w.viewOrder,
    display: w.display,
    displayInPreview: w.displayInPreview,
    required: w.required,
    searchable: w.searchable,
    allowMultiple: w.allowMultiple,
    attemptAutocomplete: w.attemptAutocomplete,
    directSearch: w.directSearch,
    clickToSearch: w.clickToSearch,
    clickToSearchType: w.clickToSearchType,
    fieldData: w.fieldData,
  };
}

function adminTemplateToPayload(t: AdminTemplate): TemplatePayload {
  return {
    name: t.name,
    showCollection: t.showCollection,
    showCollectionPosition: t.showCollectionPosition,
    showTemplate: t.showTemplate,
    showTemplatePosition: t.showTemplatePosition,
    includeInSearch: t.includeInSearch,
    indexForSearching: t.indexForSearching,
    isHidden: t.isHidden,
    templateColor: t.templateColor,
    recursiveIndexDepth: t.recursiveIndexDepth,
    widgetArray: t.widgetArray.map(adminWidgetToPayload),
  };
}

function emptyPayload(): TemplatePayload {
  return {
    name: "",
    showCollection: false,
    showCollectionPosition: 0,
    showTemplate: false,
    showTemplatePosition: 0,
    includeInSearch: true,
    indexForSearching: true,
    isHidden: false,
    templateColor: 0,
    recursiveIndexDepth: 1,
    widgetArray: [],
  };
}

export function newWidget(order: number): AdminWidgetPayload {
  return {
    // No widgetId or fieldTitle — server assigns both for new widgets.
    fieldTypeId: FIELD_TYPE_IDS["text"],
    label: "",
    tooltip: "",
    templateOrder: order,
    viewOrder: order,
    display: true,
    displayInPreview: true,
    required: false,
    searchable: true,
    allowMultiple: false,
    attemptAutocomplete: false,
    directSearch: true,
    clickToSearch: false,
    clickToSearchType: 0,
    fieldData: null,
  };
}

export function useTemplateEditor(templateId: MaybeRefOrGetter<number | null>) {
  const isEditMode = computed(() => toValue(templateId) !== null);

  const {
    data: template,
    isLoading,
    isError,
  } = useAdminTemplateQuery(templateId);

  const form = reactive<TemplatePayload>(emptyPayload());

  // Snapshot of the last saved/loaded form state, used to detect unsaved changes.
  const savedSnapshot = ref(JSON.stringify(emptyPayload()));

  watch(
    template,
    (t) => {
      if (t) {
        Object.assign(form, adminTemplateToPayload(t));
        savedSnapshot.value = JSON.stringify(form);
      }
    },
    { immediate: true }
  );

  const createMutation = useCreateTemplateMutation();
  const updateMutation = useUpdateTemplateMutation();

  const isSaving = computed(
    () => createMutation.isPending.value || updateMutation.isPending.value
  );

  // Reflects the most recently completed (or in-flight) save operation.
  const saveStatus = computed(() =>
    isEditMode.value ? updateMutation.status.value : createMutation.status.value
  );

  const hasUnsavedChanges = computed(
    () => JSON.stringify(form) !== savedSnapshot.value
  );

  // ISO date string of the template's last server-side modification, if known.
  const lastModifiedAt = computed(() => template.value?.modifiedAt ?? null);

  async function save(): Promise<number> {
    if (!isEditMode.value) {
      const summary = await createMutation.mutateAsync(form);
      savedSnapshot.value = JSON.stringify(form);
      return summary.id;
    }

    const summary = await updateMutation.mutateAsync({
      templateId: toValue(templateId) as number,
      payload: form,
    });
    savedSnapshot.value = JSON.stringify(form);
    return summary.id;
  }

  function addWidget() {
    form.widgetArray.push(newWidget(form.widgetArray.length + 1));
  }

  function removeWidget(index: number) {
    form.widgetArray.splice(index, 1);
  }

  return {
    form,
    isEditMode,
    isLoading,
    isError,
    isSaving,
    saveStatus,
    hasUnsavedChanges,
    lastModifiedAt,
    save,
    addWidget,
    removeWidget,
  };
}

export type TemplateEditor = ReturnType<typeof useTemplateEditor>;
export const TEMPLATE_EDITOR_KEY = Symbol() as InjectionKey<TemplateEditor>;
