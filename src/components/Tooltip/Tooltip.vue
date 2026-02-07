<template>
  <TooltipProvider :delayDuration="delayDurationComputed">
    <Tooltip>
      <TooltipTrigger asChild>
        <slot />
      </TooltipTrigger>
      <TooltipContent>
        <slot name="content">
          {{ tip }}
        </slot>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
</template>
<script setup lang="ts">
import {
  TooltipProvider,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    openDelay?: number;
    delayDuration?: number;
    tip?: string;
  }>(),
  {
    openDelay: undefined, // previous api
    delayDuration: 300, // current api
    tip: "",
  }
);

const delayDurationComputed = computed(() => {
  return props.openDelay ?? props.delayDuration;
});
</script>
<style scoped>
.tooltip {
  --color-tooltip-bg: oklch(var(--on-surface));
  --color-tooltip-text: oklch(var(--surface));
  --shadow-tooltip: 0 4px 6px -1px rgb(0 0 0 / 0.1),
    0 2px 4px -2px rgb(0 0 0 / 0.1);
}

.tooltip.tooltip--light {
  --color-tooltip-bg: oklch(var(--surface));
  --color-tooltip-text: oklch(var(--on-surface));
}

:deep(.popper) {
  --color-tooltip-bg: oklch(var(--on-surface));
  --color-tooltip-text: oklch(var(--surface));
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
