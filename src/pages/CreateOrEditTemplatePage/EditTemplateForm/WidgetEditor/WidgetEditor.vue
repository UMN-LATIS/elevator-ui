<template>
  <div class="border border-outline-variant rounded-md p-4 flex flex-col gap-4">
    <!-- Header: type icon + label + remove -->
    <div class="flex justify-between items-center gap-2">
      <div class="flex items-center gap-2 min-w-0">
        <component
          :is="currentTypeIcon"
          class="w-4 h-4 shrink-0 text-primary" />
        <span class="font-medium text-sm text-on-surface-variant truncate">
          {{ widget.label || "(new field)" }}
        </span>
      </div>
      <Button
        type="button"
        variant="tertiary"
        class="shrink-0 text-error hover:text-on-error-container"
        @click="$emit('remove')">
        Remove
      </Button>
    </div>

    <!-- 1. Label -->
    <InputGroup v-model="widget.label" label="Label" required />

    <!-- 2. Field type -->
    <SelectGroup
      v-model="widget.fieldTypeId"
      :options="fieldTypeOptions"
      label="Field type"
      @update:modelValue="handleTypeChange" />

    <!-- 3. Field data -->
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

    <!-- 4. Options -->
    <InputGroup
      v-model="widget.tooltip"
      label="Tooltip"
      placeholder="Optional help text" />

    <div class="grid grid-cols-2 gap-x-8 gap-y-2">
      <ToggleGroup v-model="widget.display" label="Display on asset page" />
      <ToggleGroup
        v-model="widget.displayInPreview"
        label="Display in preview" />
      <ToggleGroup v-model="widget.required" label="Required" />
      <ToggleGroup v-model="widget.searchable" label="Searchable" />
      <ToggleGroup v-model="widget.allowMultiple" label="Allow multiple" />
      <ToggleGroup
        v-model="widget.attemptAutocomplete"
        label="Attempt autocomplete" />
      <ToggleGroup v-model="widget.directSearch" label="Direct search" />
      <ToggleGroup v-model="widget.clickToSearch" label="Click to search" />
    </div>

    <FormSubSection :isOpen="widget.clickToSearch">
      <template #details>
        <SelectGroup
          v-model="widget.clickToSearchType"
          :options="clickToSearchTypeOptions"
          label="Click to search type" />
      </template>
    </FormSubSection>

    <div class="grid grid-cols-2 gap-4">
      <InputGroup
        :modelValue="String(widget.templateOrder)"
        label="Edit order"
        type="number"
        @update:modelValue="widget.templateOrder = Number($event)" />
      <InputGroup
        :modelValue="String(widget.viewOrder)"
        label="View order"
        type="number"
        @update:modelValue="widget.viewOrder = Number($event)" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, ref, type Component } from "vue";
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
} from "lucide-vue-next";
import InputGroup from "@/components/InputGroup/InputGroup.vue";
import SelectGroup from "@/components/SelectGroup/SelectGroup.vue";
import ToggleGroup from "@/components/ToggleGroup/ToggleGroup.vue";
import FormSubSection from "@/components/Form/FormSubSection.vue";
import TextAreaGroup from "@/components/TextAreaGroup/TextAreaGroup.vue";
import Button from "@/components/Button/Button.vue";
import { FIELD_TYPE_IDS } from "@/constants/constants";
import { TEMPLATE_EDITOR_KEY } from "../../useTemplateEditor/useTemplateEditor";
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

const fieldTypeOptions: SelectOption<number>[] = Object.entries(
  FIELD_TYPE_IDS
).map(([label, id]) => ({ id, label }));

const clickToSearchTypeOptions: SelectOption<number>[] = [
  { id: 0, label: "Global search" },
  { id: 1, label: "Field-specific search" },
];

const FIELD_TYPE_ICONS: Record<number, Component> = {
  [FIELD_TYPE_IDS.text]: TypeIcon,
  [FIELD_TYPE_IDS["text area"]]: AlignLeftIcon,
  [FIELD_TYPE_IDS.select]: ListIcon,
  [FIELD_TYPE_IDS.checkbox]: CheckSquareIcon,
  [FIELD_TYPE_IDS.date]: CalendarIcon,
  [FIELD_TYPE_IDS["tag list"]]: TagIcon,
  [FIELD_TYPE_IDS.multiselect]: ListChecksIcon,
  [FIELD_TYPE_IDS.location]: MapPinIcon,
  [FIELD_TYPE_IDS.upload]: PaperclipIcon,
  [FIELD_TYPE_IDS["related asset"]]: LinkIcon,
};

const currentTypeIcon = computed(
  () => FIELD_TYPE_ICONS[widget.fieldTypeId] ?? TypeIcon
);

// Default fieldData JSON per widget type — mirrors legacy editor auto-fill.
const FIELD_DATA_DEFAULTS: Partial<Record<WidgetType, unknown>> = {
  select: { multiSelect: false, selectGroup: [] },
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
