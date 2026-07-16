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
    <SelectRoot
      multiple
      :modelValue="modelValue"
      @update:modelValue="handleSelect">
      <SelectTrigger
        :aria-labelledby="labelId"
        class="flex items-center gap-2 w-full rounded-md border border-outline-variant bg-surface-container px-3 py-2 text-sm text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary">
        <span
          class="flex-1 truncate"
          :class="
            modelValue.length ? 'text-on-surface' : 'text-on-surface-variant'
          ">
          {{ triggerText }}
        </span>
        <SelectIcon class="shrink-0 text-on-surface-variant">
          <ChevronsUpDownIcon class="w-4 h-4" />
        </SelectIcon>
      </SelectTrigger>

      <SelectPortal>
        <SelectContent
          position="popper"
          :sideOffset="4"
          class="z-[100] min-w-[var(--reka-select-trigger-width)] max-w-[calc(100vw_-_2rem)] max-h-[var(--reka-select-content-available-height)] overflow-y-auto rounded-md bg-surface-container py-1 shadow-lg ring-1 ring-outline-variant">
          <SelectViewport>
            <SelectItem
              v-for="opt in options"
              :key="opt.id"
              :value="opt.id"
              class="flex items-center gap-2 px-3 py-2 text-sm cursor-default select-none text-on-surface-variant data-[highlighted]:bg-surface-container-high data-[highlighted]:text-on-surface data-[state=checked]:font-medium data-[state=checked]:text-on-surface focus:outline-none">
              <span class="size-4 shrink-0">
                <SelectItemIndicator>
                  <CheckIcon class="w-4 h-4 text-primary" />
                </SelectItemIndicator>
              </span>
              <SelectItemText class="flex-1 truncate">
                {{ opt.label }}
              </SelectItemText>
            </SelectItem>
            <p
              v-if="!options.length"
              class="px-3 py-2 text-sm text-on-surface-variant">
              {{ emptyText }}
            </p>
          </SelectViewport>
        </SelectContent>
      </SelectPortal>
    </SelectRoot>
  </div>
</template>

<script setup lang="ts">
import { computed, useId } from "vue";
import {
  SelectRoot,
  SelectTrigger,
  SelectIcon,
  SelectPortal,
  SelectContent,
  SelectViewport,
  SelectItem,
  SelectItemText,
  SelectItemIndicator,
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
    // sits in a row of filters that names itself
    showLabel?: boolean;
    emptyText?: string;
  }>(),
  { showLabel: true, placeholder: "", emptyText: "Nothing to filter by" }
);

const emit = defineEmits<{ "update:modelValue": [value: number[]] }>();

const labelId = useId();

// One pick reads better as itself than as a count.
const triggerText = computed((): string => {
  if (props.modelValue.length === 0) return props.placeholder;
  if (props.modelValue.length === 1) {
    const onlyPick = props.options.find(
      (option) => option.id === props.modelValue[0]
    );
    return onlyPick?.label ?? `1 selected`;
  }
  return `${props.modelValue.length} selected`;
});

// reka-ui yields untyped AcceptableValues, and every SelectItem here
// carries a numeric id, so narrow before emitting.
function handleSelect(value: AcceptableValue | AcceptableValue[]): void {
  const picks = Array.isArray(value) ? value : [value];
  emit(
    "update:modelValue",
    picks.filter((pick): pick is number => typeof pick === "number")
  );
}
</script>
