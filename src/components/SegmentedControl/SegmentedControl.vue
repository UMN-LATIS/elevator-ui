<template>
  <div
    :class="cn('flex items-center justify-between gap-4 flex-wrap', $attrs.class as CSSClass)">
    <span
      class="text-sm text-on-surface"
      :class="{
        'sr-only': !showLabel,
      }">
      {{ label }}
    </span>
    <div
      role="group"
      :aria-label="label"
      class="flex rounded-md border border-outline-variant overflow-hidden shrink-0">
      <label
        v-for="opt in options"
        :key="opt.id"
        :class="[
          'relative flex items-center px-3 py-1 text-xs cursor-pointer select-none transition-colors',
          'not-first:border-l not-first:border-outline-variant',
          modelValue === opt.id
            ? 'bg-primary text-on-primary font-medium'
            : 'bg-surface-container text-on-surface hover:bg-surface-container-high',
          opt.disabled && 'opacity-50 cursor-not-allowed',
        ]">
        <input
          type="radio"
          :name="groupName"
          :value="opt.id"
          :checked="modelValue === opt.id"
          :disabled="opt.disabled"
          class="sr-only"
          @change="$emit('update:modelValue', opt.id)" />
        {{ opt.label }}
      </label>
    </div>
  </div>
</template>

<script setup lang="ts" generic="TValue extends string | number">
import { useId } from "vue";
import type { CSSClass, SelectOption } from "@/types";
import { cn } from "@/lib/utils";

withDefaults(
  defineProps<{
    modelValue: TValue | null;
    label: string;
    options: SelectOption<TValue>[];
    showLabel?: boolean;
  }>(),
  {
    showLabel: true,
  }
);

defineEmits<{
  (e: "update:modelValue", value: TValue): void;
}>();

const groupName = useId();
</script>
