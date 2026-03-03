<template>
  <div class="px-4 py-2 flex flex-col">
    <!-- Header: type icon + label + remove -->
    <div class="flex justify-between items-center gap-2 mb-2">
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
      class="mb-2"
      label="Label"
      :labelHidden="true"
      placeholder="Field label"
      required />

    <template v-if="hasFieldData">
      <TextAreaGroup
        :modelValue="rawFieldDataString"
        class="mb-4"
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
    <div class="mb-2">
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
import { Trash2Icon, TypeIcon } from "lucide-vue-next";
import InputGroup from "@/components/InputGroup/InputGroup.vue";
import ToggleGroup from "@/components/ToggleGroup/ToggleGroup.vue";
import SegmentedControl from "@/components/SegmentedControl/SegmentedControl.vue";
import TextAreaGroup from "@/components/TextAreaGroup/TextAreaGroup.vue";
import FieldTypeSelect from "./FieldTypeSelect.vue";
import ConfirmModal from "@/components/ConfirmModal/ConfirmModal.vue";
import { ChevronRightIcon } from "@/icons";
import {
  FIELD_TYPE_NAME_ICONS,
  FIELD_TYPE_SAMPLE_DATA,
  FIELD_TYPE_DISPLAY_NAMES,
} from "../fieldTypeConstants";
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

const toTitleCase = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase());

const fieldTypeOptions = computed(() =>
  (fieldTypes.value ?? []).map((ft) => ({
    id: ft.id,
    label: FIELD_TYPE_DISPLAY_NAMES[ft.name] ?? toTitleCase(ft.name),
    icon: FIELD_TYPE_NAME_ICONS[ft.name] ?? TypeIcon,
  }))
);

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

// Build a lookup map from fieldTypeId → effective sample field data.
// Server's sampleFieldData takes precedence; falls back to client-side defaults
// for types that have configurable field data but where the server returns null.
const sampleFieldDataByTypeId = computed(() => {
  if (!fieldTypes.value) return {} as Record<number, unknown>;
  return Object.fromEntries(
    fieldTypes.value.map((ft) => [
      ft.id,
      ft.sampleFieldData ?? FIELD_TYPE_SAMPLE_DATA[ft.name] ?? null,
    ])
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

// [] is a legacy backend artifact on simple-type widgets, not user-entered config.
function isEmptyFieldData(value: unknown): boolean {
  if (value === null) return true;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value).length === 0;
  return false;
}

function handleTypeChange(newTypeId: number) {
  const sample = sampleFieldDataByTypeId.value[newTypeId] ?? null;
  if (sample === null) {
    // New type has no configurable field data — clear any stale config.
    widget.value.fieldData = null;
    return;
  }
  // Pre-fill with sample only when there's no real user-entered config.
  if (isEmptyFieldData(widget.value.fieldData)) {
    widget.value.fieldData = sample;
  }
}
</script>
