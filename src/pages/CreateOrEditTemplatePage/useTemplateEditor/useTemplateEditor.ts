import {
  reactive,
  computed,
  watch,
  type InjectionKey,
  type Ref,
  MaybeRefOrGetter,
  toValue,
} from "vue";
import { useAdminTemplateQuery } from "@/queries/useTemplateQuery";
import {
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

  // Sync server data into form once loaded (edit mode only).
  watch(
    template,
    (t) => {
      if (t) Object.assign(form, adminTemplateToPayload(t));
    },
    { immediate: true }
  );

  const createMutation = useCreateTemplateMutation();
  const updateMutation = useUpdateTemplateMutation();

  const isSaving = computed(
    () => createMutation.isPending.value || updateMutation.isPending.value
  );

  async function save(): Promise<number> {
    // creating a new template
    if (!isEditMode.value) {
      const summary = await createMutation.mutateAsync(form);
      return summary.id;
    }

    // saving an existing template
    const summary = await updateMutation.mutateAsync({
      templateId: toValue(templateId) as number,
      payload: form,
    });
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
    save,
    addWidget,
    removeWidget,
  };
}

export type TemplateEditor = ReturnType<typeof useTemplateEditor>;
export const TEMPLATE_EDITOR_KEY = Symbol() as InjectionKey<TemplateEditor>;
