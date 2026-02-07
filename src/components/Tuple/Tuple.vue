<template>
  <div
    class="tuple"
    :class="{
      'w-full': variant === 'stacked',
      'inline-flex items-baseline gap-2': variant === 'inline',
    }">
    <div class="tuple__label flex justify-between items-center">
      <slot name="label">
        <span
          :class="
            cn(
              'text-xs block uppercase leading-none mb-1 tracking-wide',
              {
                'font-medium': variant === 'stacked',
                'sr-only': variant === 'value-only',
              },
              labelClass
            )
          ">
          {{ label }}
        </span>
        <slot name="label-extra"></slot>
      </slot>
    </div>
    <span class="tuple__value block" v-bind="$attrs">
      <slot>-</slot>
    </span>
  </div>
</template>
<script setup lang="ts">
import { cn } from "@/lib/utils";
import { CSSClass } from "@/types";

withDefaults(
  defineProps<{
    label: string;
    variant?: "stacked" | "inline" | "value-only";
    labelClass?: CSSClass;
  }>(),
  {
    variant: "stacked",
    labelClass: "",
  }
);
</script>
<script lang="ts">
export default {
  inheritAttrs: false,
};
</script>

<style scoped>
.tuple__label {
  color: oklch(var(--on-surface));
}

.tuple__value {
  color: oklch(var(--on-surface-variant));
}
</style>
