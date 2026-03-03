<template>
  <div class="p-4 flex flex-col gap-4">
    <!-- Header: type icon + label + remove -->
    <div class="flex justify-between items-center gap-2">
      <FieldTypeSelect
        v-model="widget.fieldTypeId"
        :showLabel="false"
        class="flex-1"
        :options="fieldTypeOptions"
        @update:modelValue="handleTypeChange" />
      <button
        type="button"
        class="shrink-0 text-error hover:text-on-error-container p-1 rounded"
        aria-label="Remove field"
        @click="$emit('remove')">
        <Trash2Icon class="w-4 h-4" />
      </button>
    </div>

    <InputGroup v-model="widget.label" label="Label" required />

    <template v-if="hasFieldData">
      <TextAreaGroup
        :modelValue="fieldDataString"
        label="Field data (JSON)"
        :inputClass="[
          'font-mono text-sm h-24',
          isFieldDataInvalid ? 'border-error' : '',
        ]"
        placeholder="null"
        @update:modelValue="handleFieldDataChange" />
      <p v-if="isFieldDataInvalid" class="text-error text-xs -mt-3">
        Invalid JSON
      </p>
    </template>

    <!-- Options accordion -->
    <div>
      <button
        type="button"
        class="flex items-center gap-1 text-xs text-on-surface-variant hover:text-on-surface uppercase tracking-wide font-medium"
        @click="showOptions = !showOptions">
        <ChevronRightIcon
          :class="[
            '!size-4 transition-transform duration-150',
            showOptions && 'rotate-90',
          ]" />
        Options
      </button>

      <div v-if="showOptions" class="mt-4 flex flex-col gap-4 pl-5">
        <!-- Display -->
        <div class="flex flex-col gap-2">
          <p class="text-xs uppercase font-medium text-on-surface-variant">
            Display
          </p>
          <ToggleGroup v-model="widget.display" label="Display on asset page" />
          <ToggleGroup
            v-model="widget.displayInPreview"
            label="Display in preview" />
        </div>

        <!-- Behavior -->
        <div class="flex flex-col gap-2">
          <p class="text-xs uppercase font-medium text-on-surface-variant">
            Behavior
          </p>
          <ToggleGroup v-model="widget.required" label="Required" />
          <ToggleGroup v-model="widget.allowMultiple" label="Allow multiple" />
          <ToggleGroup
            v-model="widget.attemptAutocomplete"
            label="Attempt autocomplete" />
          <ToggleGroup v-model="showTooltip" label="Show tooltip" />
          <InputGroup
            v-if="showTooltip"
            v-model="widget.tooltip"
            label="Tooltip text"
            placeholder="Help text shown to users" />
        </div>

        <!-- Search -->
        <div class="flex flex-col gap-2">
          <p class="text-xs uppercase font-medium text-on-surface-variant">
            Search
          </p>
          <ToggleGroup v-model="widget.searchable" label="Searchable" />
          <ToggleGroup v-model="widget.directSearch" label="Direct search" />
          <SegmentedControl
            v-model="clickToSearchMode"
            label="Click to search"
            :options="clickToSearchOptions" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, ref, watch } from "vue";
import {
  TypeIcon,
  AlignLeftIcon,
  ListIcon,
  CheckSquareIcon,
  CalendarIcon,
  TagIcon,
  ListChecksIcon,
  MapPinIcon,
  PaperclipIcon,
  LinkIcon,
  Trash2Icon,
} from "lucide-vue-next";
import InputGroup from "@/components/InputGroup/InputGroup.vue";
import ToggleGroup from "@/components/ToggleGroup/ToggleGroup.vue";
import SegmentedControl from "@/components/SegmentedControl/SegmentedControl.vue";
import TextAreaGroup from "@/components/TextAreaGroup/TextAreaGroup.vue";
import FieldTypeSelect from "./FieldTypeSelect.vue";
import { ChevronRightIcon } from "@/icons";
import { FIELD_TYPE_IDS } from "@/constants/constants";
import { TEMPLATE_EDITOR_KEY } from "../../useTemplateEditor/useTemplateEditor";
import { WIDGET_OPTIONS_KEY } from "../widgetOptionsKey";
import type { SelectOption, WidgetType } from "@/types";

const props = defineProps<{ index: number }>();

const editor = inject(TEMPLATE_EDITOR_KEY);
if (!editor)
  throw new Error(
    "WidgetEditor must be used inside a template editor provider"
  );
// widget is the reactive object owned by the composable — not a prop,
// so direct mutations here are legitimate reactive state updates.
const widget = editor.form.widgetArray[props.index];

defineEmits<{ remove: [] }>();

const showOptions = ref(false);

const widgetOptionsState = inject(WIDGET_OPTIONS_KEY);
watch(
  () => widgetOptionsState?.value.trigger,
  () => {
    if (widgetOptionsState) showOptions.value = widgetOptionsState.value.open;
  }
);

const showTooltip = ref(!!widget.tooltip);
watch(showTooltip, (value) => {
  if (!value) widget.tooltip = "";
});

const fieldTypeOptions = [
  { id: FIELD_TYPE_IDS.text, label: "text", icon: TypeIcon },
  { id: FIELD_TYPE_IDS["text area"], label: "text area", icon: AlignLeftIcon },
  { id: FIELD_TYPE_IDS.select, label: "select", icon: ListIcon },
  { id: FIELD_TYPE_IDS.checkbox, label: "checkbox", icon: CheckSquareIcon },
  { id: FIELD_TYPE_IDS.date, label: "date", icon: CalendarIcon },
  { id: FIELD_TYPE_IDS["tag list"], label: "tag list", icon: TagIcon },
  {
    id: FIELD_TYPE_IDS.multiselect,
    label: "multiselect",
    icon: ListChecksIcon,
  },
  { id: FIELD_TYPE_IDS.location, label: "location", icon: MapPinIcon },
  { id: FIELD_TYPE_IDS.upload, label: "upload", icon: PaperclipIcon },
  {
    id: FIELD_TYPE_IDS["related asset"],
    label: "related asset",
    icon: LinkIcon,
  },
];

const clickToSearchOptions: SelectOption<string>[] = [
  { id: "off", label: "Off" },
  { id: "global", label: "Global" },
  { id: "field", label: "Field-specific" },
];

const clickToSearchMode = computed({
  get: () => {
    if (!widget.clickToSearch) return "off";
    return widget.clickToSearchType === 1 ? "field" : "global";
  },
  set: (value: string) => {
    widget.clickToSearch = value !== "off";
    widget.clickToSearchType = value === "field" ? 1 : 0;
  },
});

const FIELD_DATA_TYPES = new Set([
  FIELD_TYPE_IDS.select,
  FIELD_TYPE_IDS.multiselect,
  FIELD_TYPE_IDS.upload,
  FIELD_TYPE_IDS["related asset"],
]);

const hasFieldData = computed(() => FIELD_DATA_TYPES.has(widget.fieldTypeId));

const currentTypeIcon = computed(
  () =>
    fieldTypeOptions.find((o) => o.id === widget.fieldTypeId)?.icon ?? TypeIcon
);

// Default fieldData JSON per widget type — mirrors legacy editor auto-fill.
const FIELD_DATA_DEFAULTS: Partial<Record<WidgetType, unknown>> = {
  select: { multiSelect: false, selectGroup: [] },
  // Hierarchical category tree: { "Category": { "Subcategory": {} } }
  multiselect: {},
  upload: {
    extractDate: false,
    extractLocation: false,
    enableTiling: false,
    enableIframe: false,
    interactiveTranscript: false,
    ignoreForDigitalAsset: false,
    forceTiling: false,
    enableDendro: false,
    enableAnnotation: false,
  },
  "related asset": {
    defaultTemplate: null,
    matchAgainst: [],
    nestData: false,
    displayInline: false,
    collapseNestedChildren: false,
    thumbnailView: false,
    showLabel: false,
    ignoreForDigitalAsset: false,
    ignoreForLocationSearch: false,
    ignoreForDateSearch: false,
  },
};

const isFieldDataInvalid = ref(false);

const fieldDataString = computed(() =>
  widget.fieldData != null ? JSON.stringify(widget.fieldData, null, 2) : ""
);

function handleFieldDataChange(value: string) {
  if (!value.trim()) {
    widget.fieldData = null;
    isFieldDataInvalid.value = false;
    return;
  }
  try {
    widget.fieldData = JSON.parse(value);
    isFieldDataInvalid.value = false;
  } catch {
    isFieldDataInvalid.value = true;
  }
}

function handleTypeChange(newTypeId: number) {
  // Only pre-fill fieldData when empty — don't overwrite existing config.
  if (widget.fieldData != null) return;

  const typeName = Object.entries(FIELD_TYPE_IDS).find(
    ([, id]) => id === newTypeId
  )?.[0] as WidgetType | undefined;

  if (typeName && typeName in FIELD_DATA_DEFAULTS) {
    widget.fieldData = FIELD_DATA_DEFAULTS[typeName] ?? null;
  }
}
</script>
