<template>
  <Tooltip :tip="title">
    <component
      :is="componentType"
      :href="resolvedHref"
      :type="type"
      :to="componentType === RouterLink ? to : undefined"
      :aria-label="title"
      v-bind="$attrs"
      :class="cn('icon-button flex items-center justify-center aspect-square p-2 rounded-md transition-colors duration-150 text-primary hover:bg-primary-container hover:text-on-primary-container focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed', $attrs.class as CSSClass)"
      @click="($event) => $emit('click', $event)">
      <slot />
    </component>
  </Tooltip>
</template>
<script setup lang="ts">
import { cn } from "@/lib/utils.js";
import Tooltip from "../Tooltip/Tooltip.vue";

import { computed } from "vue";
import { RouterLink, type RouteLocationRaw, useRouter } from "vue-router";
import { CSSClass } from "@/types/index.js";
const props = withDefaults(
  defineProps<{
    title: string;
    href?: string;
    to?: RouteLocationRaw;
    type?: "button" | "submit" | "reset";
  }>(),
  {
    href: undefined,
    to: undefined,
    type: "button",
  }
);

defineEmits<{
  (eventName: "click", event: MouseEvent): true;
}>();

const router = useRouter();
const resolvedHref = computed(() => {
  if (props.href) {
    return props.href;
  } else if (props.to && componentType.value === RouterLink) {
    // If `to` is an object, resolve it to a string URL
    return router.resolve(props.to).href;
  }
  return undefined;
});

const componentType = computed(() => {
  if (props.href) return "a";
  if (props.to) return RouterLink;
  return "button";
});
</script>
<style scoped>
/* Disabled state - works across all themes using M3 semantic tokens */
.icon-button:disabled {
  background: color-mix(in oklch, var(--on-surface) 12%, transparent);
  color: color-mix(in oklch, var(--on-surface) 38%, transparent);
}

/* Tertiary variant has different disabled background */
.icon-button.button--tertiary:disabled {
  background: transparent;
}
</style>
