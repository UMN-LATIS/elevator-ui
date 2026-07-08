<template>
  <div class="flex flex-col gap-1">
    <label class="text-xs uppercase font-medium text-on-surface">
      {{ label }}
    </label>
    <SelectRoot :modelValue="modelValue" @update:modelValue="handleSelect">
      <SelectTrigger
        class="flex items-center gap-2 w-full rounded-md border border-outline-variant bg-surface-container px-3 py-2 text-sm text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary data-[placeholder]:text-on-surface-variant">
        <template v-if="selectedOption">
          <i
            :class="[
              'size-2 shrink-0 rounded-full',
              permissionDotClass(selectedOption.level),
            ]" />
          <span class="flex-1 truncate text-on-surface">
            {{ selectedOption.label }}
          </span>
          <span class="shrink-0 tabular-nums text-on-surface-variant">
            {{ selectedOption.level }}
          </span>
        </template>
        <span v-else class="flex-1 truncate text-on-surface-variant">
          {{ placeholder }}
        </span>
        <SelectIcon class="shrink-0 text-on-surface-variant">
          <ChevronsUpDownIcon class="w-4 h-4" />
        </SelectIcon>
      </SelectTrigger>

      <SelectPortal>
        <SelectContent
          position="popper"
          :sideOffset="4"
          class="z-[100] w-[var(--reka-select-trigger-width)] max-h-[var(--reka-select-content-available-height)] overflow-y-auto rounded-md bg-surface-container py-1 shadow-lg ring-1 ring-outline-variant">
          <SelectViewport>
            <SelectItem
              v-for="opt in options"
              :key="opt.id"
              :value="opt.id"
              class="flex items-center gap-2 px-3 py-2 text-sm cursor-default select-none text-on-surface-variant data-[highlighted]:bg-surface-container-high data-[highlighted]:text-on-surface data-[state=checked]:font-medium data-[state=checked]:text-on-surface focus:outline-none">
              <i
                :class="[
                  'size-2 shrink-0 rounded-full',
                  permissionDotClass(opt.level),
                ]" />
              <SelectItemText class="flex-1 truncate">
                {{ opt.label }}
              </SelectItemText>
              <span class="shrink-0 tabular-nums text-on-surface-variant">
                {{ opt.level }}
              </span>
              <SelectItemIndicator class="shrink-0">
                <CheckIcon class="w-4 h-4 text-primary" />
              </SelectItemIndicator>
            </SelectItem>
          </SelectViewport>
        </SelectContent>
      </SelectPortal>
    </SelectRoot>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
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
import { permissionDotClass } from "./permissionDotClass";

export interface PermissionSelectOption {
  id: number;
  label: string;
  // the numeric strength (a PERM value), shown as the secondary number and
  // driving the dot color
  level: number;
}

const props = defineProps<{
  modelValue: number | null;
  options: PermissionSelectOption[];
  label: string;
  placeholder?: string;
}>();

const emit = defineEmits<{ "update:modelValue": [value: number] }>();

const selectedOption = computed(() =>
  props.options.find((option) => option.id === props.modelValue)
);

// reka-ui yields the untyped AcceptableValue; every SelectItem carries a
// numeric level id, so narrow before emitting.
function handleSelect(value: AcceptableValue): void {
  if (typeof value === "number") emit("update:modelValue", value);
}
</script>
