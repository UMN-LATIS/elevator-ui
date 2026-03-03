<template>
  <div class="p-4 flex flex-col gap-4">
    <!-- Header: type icon + label + remove -->
    <div class="flex justify-between items-center gap-2">
      <FieldTypeSelect
        v-model="widget.fieldTypeId"
        class="flex-1"
        :options="fieldTypeOptions"
        @update:modelValue="handleTypeChange" />
      <button
        type="button"
        class="shrink-0 text-error hover:text-on-error-container p-1 rounded"
        aria-label="Remove field"
        @click="showConfirm = true">
        <Trash2Icon class="w-4 h-4" />
      </button>

      <ConfirmModal
        :isOpen="showConfirm"
        title="Remove field?"
        type="danger"
        confirmLabel="Remove"
        @confirm="$emit('remove')"
        @close="showConfirm = false">
        <p>
          This will remove
          <strong>{{ widget.label || "this field" }}</strong>
          from the template. Any data already saved to this field will no longer
          be visible or editable.
        </p>
      </ConfirmModal>
    </div>

    <InputGroup
      v-model="widget.label"
      label="Label"
      :labelHidden="true"
      placeholder="Field label"
      required />

    <template v-if="hasFieldData">
      <TextAreaGroup
        :modelValue="rawFieldDataString"
        label="Field data (JSON)"
        :inputClass="[
          'font-mono text-sm h-24',
          isFieldDataInvalid ? 'border-error' : '',
        ]"
        placeholder="null"
        @update:modelValue="handleFieldDataChange"
        @focus="isFocused = true"
        @blur="handleFieldDataBlur" />
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
import { useFieldTypesQuery } from "@/queries/useTemplateQuery";
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
import ConfirmModal from "@/components/ConfirmModal/ConfirmModal.vue";
import { ChevronRightIcon } from "@/icons";
import { FIELD_TYPE_IDS } from "@/constants/constants";
import { TEMPLATE_EDITOR_KEY } from "../../useTemplateEditor/useTemplateEditor";
import { WIDGET_OPTIONS_KEY } from "../widgetOptionsKey";
import type { SelectOption } from "@/types";
import { useInstanceStore } from "@/stores/instanceStore";

const props = defineProps<{ index: number }>();

const editor = inject(TEMPLATE_EDITOR_KEY);
if (!editor)
  throw new Error(
    "WidgetEditor must be used inside a template editor provider"
  );
// Computed so the reference stays live when the parent array is spliced.
// Vue auto-unwraps computed refs in the template, so template bindings
// like `v-model="widget.label"` work without `.value`.
const widget = computed(() => editor.form.widgetArray[props.index]);

defineEmits<{ remove: [] }>();

const showConfirm = ref(false);

const instanceStore = useInstanceStore();

// Mirror the legacy editor behavior: derive fieldTitle from label for new widgets.
// Existing widgets (widgetId set) already have a locked fieldTitle — never overwrite it.
watch(
  () => widget.value.label,
  (label) => {
    if (widget.value.widgetId !== undefined) return;
    const instanceId = instanceStore.instance.id;
    if (!instanceId) return;
    widget.value.fieldTitle =
      label.replace(/[^a-z0-9_]/gi, "").toLowerCase() + "_" + instanceId;
  }
);

const showOptions = ref(false);

const widgetOptionsState = inject(WIDGET_OPTIONS_KEY);
if (widgetOptionsState) {
  watch(
    () => widgetOptionsState.value.trigger,
    () => {
      showOptions.value = widgetOptionsState.value.open;
    }
  );
}

const showTooltip = ref(!!widget.value.tooltip);
watch(showTooltip, (value) => {
  if (!value) widget.value.tooltip = "";
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
    if (!widget.value.clickToSearch) return "off";
    return widget.value.clickToSearchType === 1 ? "field" : "global";
  },
  set: (value: string) => {
    widget.value.clickToSearch = value !== "off";
    widget.value.clickToSearchType = value === "field" ? 1 : 0;
  },
});

const { data: fieldTypes } = useFieldTypesQuery();

// Build a lookup map from fieldTypeId → sampleFieldData for use in handleTypeChange.
const sampleFieldDataByTypeId = computed(() => {
  if (!fieldTypes.value) return {} as Record<number, unknown>;
  return Object.fromEntries(
    fieldTypes.value.map((ft) => [ft.id, ft.sampleFieldData])
  ) as Record<number, unknown>;
});

// Show the fieldData JSON editor only for types that carry structured config.
// Derived from the API: types with non-null sampleFieldData have a config schema.
const hasFieldData = computed(
  () => sampleFieldDataByTypeId.value[widget.value.fieldTypeId] != null
);

const isFieldDataInvalid = ref(false);
const isFocused = ref(false);

const rawFieldDataString = ref(
  widget.value.fieldData != null
    ? JSON.stringify(widget.value.fieldData, null, 2)
    : ""
);

// Sync when fieldData is changed externally (e.g. type change auto-fills defaults)
watch(
  () => widget.value.fieldData,
  (newVal) => {
    if (!isFocused.value) {
      rawFieldDataString.value =
        newVal != null ? JSON.stringify(newVal, null, 2) : "";
      isFieldDataInvalid.value = false;
    }
  }
);

function handleFieldDataChange(value: string) {
  rawFieldDataString.value = value;
  if (!value.trim()) {
    widget.value.fieldData = null;
    isFieldDataInvalid.value = false;
    return;
  }
  try {
    widget.value.fieldData = JSON.parse(value);
    isFieldDataInvalid.value = false;
  } catch {
    isFieldDataInvalid.value = true;
  }
}

function handleFieldDataBlur() {
  isFocused.value = false;
  if (!isFieldDataInvalid.value && widget.value.fieldData != null) {
    rawFieldDataString.value = JSON.stringify(widget.value.fieldData, null, 2);
  }
}

function handleTypeChange(newTypeId: number) {
  // Only pre-fill fieldData when empty — don't overwrite existing config.
  if (widget.value.fieldData != null) return;
  widget.value.fieldData = sampleFieldDataByTypeId.value[newTypeId] ?? null;
}
</script>
