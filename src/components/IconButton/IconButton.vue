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
  background-color: var(--app-iconButton-backgroundColor, transparent);
  color: var(--app-iconButton-color, oklch(var(--m3-primary)));
  border-radius: var(--app-iconButton-borderRadius, 0.375rem);
  border: var(--app-iconButton-border, 1px solid transparent);

  &:hover {
    background-color: var(
      --app-iconButton-hover-backgroundColor,
      oklch(var(--m3-primary-container))
    );
    color: var(--app-iconButton-hover-color, oklch(var(--m3-primary)));
    border: 1px solid var(--app-iconButton-hover-color, oklch(var(--m3-primary)));
  }
}
</style>
