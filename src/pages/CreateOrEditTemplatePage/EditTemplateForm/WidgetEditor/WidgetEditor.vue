<template>
  <div class="border border-outline-variant rounded-md p-4 flex flex-col gap-4">
    <div class="flex justify-between items-center">
      <span class="font-medium text-sm text-on-surface-variant">
        {{ widget.label || '(new widget)' }}
        <span v-if="widget.fieldTitle" class="font-mono text-xs ml-2 opacity-60">
          {{ widget.fieldTitle }}
        </span>
      </span>
      <Button
        type="button"
        variant="tertiary"
        class="text-error hover:text-on-error-container"
        @click="$emit('remove')">
        Remove
      </Button>
    </div>

    <!-- fieldTitle: read-only for existing widgets, hidden for new ones -->
    <div v-if="widget.fieldTitle" class="flex flex-col gap-1">
      <label class="text-sm font-medium text-on-surface-variant">Field ID</label>
      <p class="font-mono text-sm px-3 py-2 bg-surface-container rounded-md text-on-surface-variant">
        {{ widget.fieldTitle }}
      </p>
      <p class="text-xs text-on-surface-variant opacity-75">
        Locked after first save — changing this would break existing asset data.
      </p>
    </div>

    <InputGroup v-model="widget.label" label="Label" required />
    <InputGroup v-model="widget.tooltip" label="Tooltip" placeholder="Optional help text" />

    <SelectGroup
      v-model="widget.fieldTypeId"
      :options="fieldTypeOptions"
      label="Field type"
      @update:modelValue="handleTypeChange" />

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

    <div class="grid grid-cols-2 gap-x-8 gap-y-2">
      <ToggleGroup v-model="widget.display" label="Display on asset page" />
      <ToggleGroup v-model="widget.displayInPreview" label="Display in preview" />
      <ToggleGroup v-model="widget.required" label="Required" />
      <ToggleGroup v-model="widget.searchable" label="Searchable" />
      <ToggleGroup v-model="widget.allowMultiple" label="Allow multiple" />
      <ToggleGroup v-model="widget.attemptAutocomplete" label="Attempt autocomplete" />
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

    <TextAreaGroup
      :modelValue="fieldDataString"
      label="Field data (JSON)"
      :inputClass="['font-mono text-sm h-24', isFieldDataInvalid && 'border-error']"
      placeholder="null"
      @update:modelValue="handleFieldDataChange" />
    <p v-if="isFieldDataInvalid" class="text-error text-xs -mt-3">
      Invalid JSON
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import InputGroup from "@/components/InputGroup/InputGroup.vue";
import SelectGroup from "@/components/SelectGroup/SelectGroup.vue";
import ToggleGroup from "@/components/ToggleGroup/ToggleGroup.vue";
import FormSubSection from "@/components/Form/FormSubSection.vue";
import TextAreaGroup from "@/components/TextAreaGroup/TextAreaGroup.vue";
import Button from "@/components/Button/Button.vue";
import { FIELD_TYPE_IDS } from "@/constants/constants";
import type { AdminWidgetPayload, SelectOption, WidgetType } from "@/types";

const props = defineProps<{
  widget: AdminWidgetPayload;
  index: number;
}>();

defineEmits<{ remove: [] }>();

const fieldTypeOptions: SelectOption<number>[] = Object.entries(FIELD_TYPE_IDS).map(
  ([label, id]) => ({ id, label })
);

const clickToSearchTypeOptions: SelectOption<number>[] = [
  { id: 0, label: "Global search" },
  { id: 1, label: "Field-specific search" },
];

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
  props.widget.fieldData != null
    ? JSON.stringify(props.widget.fieldData, null, 2)
    : ""
);

function handleFieldDataChange(value: string) {
  if (!value.trim()) {
    props.widget.fieldData = null;
    isFieldDataInvalid.value = false;
    return;
  }
  try {
    props.widget.fieldData = JSON.parse(value);
    isFieldDataInvalid.value = false;
  } catch {
    isFieldDataInvalid.value = true;
  }
}

function handleTypeChange(newTypeId: number) {
  // Only pre-fill fieldData when empty — don't overwrite existing config.
  if (props.widget.fieldData != null) return;

  const typeName = Object.entries(FIELD_TYPE_IDS).find(
    ([, id]) => id === newTypeId
  )?.[0] as WidgetType | undefined;

  if (typeName && typeName in FIELD_DATA_DEFAULTS) {
    props.widget.fieldData = FIELD_DATA_DEFAULTS[typeName] ?? null;
  }
}
</script>
