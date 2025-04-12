<template>
  <div class="tooltip" :class="`tooltip--${theme}`">
    <Popper
      v-bind="$attrs"
      :hover="hover"
      :openDelay="openDelay"
      :closeDelay="closeDelay"
      :arrow="arrow"
      :offsetDistance="String(offsetDistance)">
      <template #default="defaultSlotProps">
        <slot v-bind="defaultSlotProps" />
      </template>

      <template #content="contentSlotProps">
        <slot name="content" v-bind="contentSlotProps">
          {{ tip }}
        </slot>
      </template>
    </Popper>
  </div>
</template>
<script setup lang="ts">
import Popper from "vue3-popper";

withDefaults(
  defineProps<{
    theme?: "light" | "dark";
    arrow?: boolean;
    hover?: boolean;
    openDelay?: number;
    closeDelay?: number;
    offsetDistance?: number;
    tip?: string;
  }>(),
  {
    theme: "dark",
    arrow: true,
    hover: false,
    openDelay: 100,
    closeDelay: 100,
    offsetDistance: 0,
    tip: "",
  }
);
</script>
<style scoped>
.tooltip {
  --color-tooltip-bg: var(--color-neutral-900);
  --color-tooltip-text: var(--color-neutral-100);
  --shadow-tooltip: 0 4px 6px -1px rgb(0 0 0 / 0.1),
    0 2px 4px -2px rgb(0 0 0 / 0.1);
}

.tooltip.tooltip--light {
  --color-tooltip-bg: var(--color-neutral-50);
  --color-tooltip-text: var(--color-neutral-900);
}

:deep(.popper) {
  --color-tooltip-bg: var(--color-neutral-900);
  --color-tooltip-text: var(--color-neutral-100);
  background: var(--color-tooltip-bg);
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  color: var(--color-tooltip-text);
  box-shadow: var(--shadow-tooltip);
}

:deep(.popper #arrow::before) {
  background: var(--color-tooltip-bg);
}

:deep(.popper:hover),
:deep(.popper:hover > #arrow::before) {
  background: var(--color-tooltip-bg);
}
</style>
