<template>
  <div
    class="tuple"
    :class="{
      'w-full': variant === 'stacked',
      'inline-flex items-baseline gap-2': variant === 'inline',
    }"
  >
    <slot name="label">
      <span
        class="tuple__label text-xs block uppercase text-neutral-900 leading-none mb-1 tracking-wide"
        :class="{
          'font-bold': variant === 'stacked',
          'sr-only': variant === 'value-only',
        }"
        >{{ label }}</span
      >
    </slot>
    <span class="tuple__value block text-neutral-600" v-bind="$attrs">
      <slot> - </slot>
    </span>
  </div>
</template>
<script setup lang="ts">
withDefaults(
  defineProps<{
    label: string;
    variant?: "stacked" | "inline" | "value-only";
  }>(),
  {
    variant: "stacked",
  }
);
</script>
<script lang="ts">
export default {
  inheritAttrs: false,
};
</script>

<style scoped></style>
