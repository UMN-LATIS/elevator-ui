<template>
  <div
    class="tuple"
    :class="{
      'w-full': variant === 'stacked',
      'inline-flex items-baseline gap-2': variant === 'inline',
    }"
  >
    <div class="tuple__label">
      <slot name="label">
        <span
          class="text-xs block uppercase leading-none mb-1 tracking-wide"
          :class="{
            'font-bold': variant === 'stacked',
            'sr-only': variant === 'value-only',
          }"
          >{{ label }}</span
        >
      </slot>
    </div>
    <span class="tuple__value block" v-bind="$attrs">
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

<style scoped>
.tuple__label {
  color: var(--app-tuple-label-textColor);
}

.tuple__value {
  color: var(--app-tuple-value-textColor);
}
</style>
