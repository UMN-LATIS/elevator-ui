<template>
  <Popover :content="title" class="icon-button">
    <component
      :is="componentType"
      :href="resolvedHref"
      :type="type"
      :to="componentType === RouterLink ? to : undefined"
      v-bind="$attrs"
      class="flex items-center justify-center aspect-square p-2 rounded-md transition-colors duration-150"
      :title="title"
      @click="($event) => $emit('click', $event)">
      <slot />
    </component>
  </Popover>
</template>
<script setup lang="ts">
import Popover from "../Popover/Popover.vue";

import { computed } from "vue";
import { RouterLink, type RouteLocationRaw, useRouter } from "vue-router";
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
.icon-button :is(button, a, .router-link) {
  background-color: transparent;
  color: oklch(var(--primary));
  border-radius: 0.375rem;
  border: 1px solid transparent;

  &:hover {
    background-color: oklch(var(--primary-container));
    color: oklch(var(--primary));
    border: 1px solid oklch(var(--primary));
  }
}

[data-theme="dark"] .icon-button :is(button, a, .router-link) {
  color: oklch(var(--warning));

  &:hover {
    background-color: oklch(var(--warning-container));
    color: oklch(var(--on-warning-container));
    border-color: oklch(var(--warning));
  }
}
</style>
