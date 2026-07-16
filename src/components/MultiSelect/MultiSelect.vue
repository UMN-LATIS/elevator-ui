<template>
  <div class="flex flex-col gap-1">
    <label
      :id="labelId"
      :class="[
        'text-xs uppercase font-medium text-on-surface',
        { 'sr-only': !showLabel },
      ]">
      {{ label }}
    </label>
    <ComboboxRoot
      multiple
      ignoreFilter
      :modelValue="modelValue"
      :open="isOpen"
      @update:modelValue="handleSelect"
      @update:open="handleOpen">
      <ComboboxAnchor>
        <ComboboxTrigger
          :aria-labelledby="labelId"
          class="flex items-center gap-2 w-full rounded-md border border-outline-variant bg-surface-container px-3 py-2 text-sm text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary">
          <span
            class="flex-1 truncate"
            :class="
              modelValue.length ? 'text-on-surface' : 'text-on-surface-variant'
            ">
            {{ triggerText }}
          </span>
          <ChevronsUpDownIcon
            class="w-4 h-4 shrink-0 text-on-surface-variant" />
        </ComboboxTrigger>
      </ComboboxAnchor>

      <ComboboxPortal>
        <ComboboxContent
          position="popper"
          :sideOffset="4"
          class="z-[100] min-w-[var(--reka-popper-anchor-width)] max-w-[calc(100vw_-_2rem)] rounded-md bg-surface-container shadow-lg ring-1 ring-outline-variant">
          <div class="border-b border-outline-variant p-1">
            <ComboboxInput
              v-model="searchTerm"
              :placeholder="searchPlaceholder"
              class="w-full rounded-sm bg-transparent px-2 py-1 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none" />
          </div>

          <ComboboxViewport class="max-h-60 overflow-y-auto py-1">
            <ComboboxItem
              v-for="opt in matchingOptions"
              :key="opt.id"
              :value="opt.id"
              class="flex items-center gap-2 px-3 py-2 text-sm cursor-default select-none text-on-surface-variant data-[highlighted]:bg-surface-container-high data-[highlighted]:text-on-surface data-[state=checked]:font-medium data-[state=checked]:text-on-surface focus:outline-none">
              <span class="size-4 shrink-0">
                <ComboboxItemIndicator>
                  <CheckIcon class="w-4 h-4 text-primary" />
                </ComboboxItemIndicator>
              </span>
              <span class="flex-1 truncate">{{ opt.label }}</span>
            </ComboboxItem>

            <p
              v-if="!matchingOptions.length"
              class="px-3 py-2 text-sm text-on-surface-variant">
              {{ options.length ? "No matches" : emptyText }}
            </p>
          </ComboboxViewport>
        </ComboboxContent>
      </ComboboxPortal>
    </ComboboxRoot>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, useId } from "vue";
import {
  ComboboxRoot,
  ComboboxAnchor,
  ComboboxTrigger,
  ComboboxInput,
  ComboboxPortal,
  ComboboxContent,
  ComboboxViewport,
  ComboboxItem,
  ComboboxItemIndicator,
  type AcceptableValue,
} from "reka-ui";
import { ChevronsUpDownIcon, CheckIcon } from "lucide-vue-next";
import type { SelectOption } from "@/types";

const props = withDefaults(
  defineProps<{
    modelValue: number[];
    options: SelectOption<number>[];
    label: string;
    placeholder?: string;
    // hide the label visually, kept for screen readers, when the control
    // sits under a heading that already names it
    showLabel?: boolean;
    searchPlaceholder?: string;
    emptyText?: string;
  }>(),
  {
    showLabel: true,
    placeholder: "",
    searchPlaceholder: "Search…",
    emptyText: "Nothing to filter by",
  }
);

const emit = defineEmits<{ "update:modelValue": [value: number[]] }>();

const labelId = useId();
const isOpen = ref(false);
const searchTerm = ref("");

// Each option carries a numeric id, so reka's own filter would match on
// the id rather than the label. `ignoreFilter` hands the job here.
const matchingOptions = computed((): SelectOption<number>[] => {
  const term = searchTerm.value.trim().toLowerCase();
  if (!term) return props.options;
  return props.options.filter((option) =>
    option.label.toLowerCase().includes(term)
  );
});

// One pick reads better as itself than as a count.
const triggerText = computed((): string => {
  if (props.modelValue.length === 0) return props.placeholder;
  if (props.modelValue.length === 1) {
    const onlyPick = props.options.find(
      (option) => option.id === props.modelValue[0]
    );
    return onlyPick?.label ?? "1 selected";
  }
  return `${props.modelValue.length} selected`;
});

function handleOpen(open: boolean): void {
  isOpen.value = open;
  // a stale term would hide most of the list on the next open
  if (!open) searchTerm.value = "";
}

// reka-ui yields untyped AcceptableValues, and every item here carries a
// numeric id, so narrow before emitting.
function handleSelect(value: AcceptableValue | AcceptableValue[]): void {
  const picks = Array.isArray(value) ? value : [value];
  emit(
    "update:modelValue",
    picks.filter((pick): pick is number => typeof pick === "number")
  );
}
</script>
