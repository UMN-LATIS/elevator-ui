<template>
  <Popover :content="title">
    <component
      :is="componentType"
      :href="resolvedHref"
      :type="type"
      :to="componentType === RouterLink ? to : undefined"
      v-bind="$attrs"
      class="flex items-center justify-center aspect-square p-2 text-neutral-900 hover:text-blue-700 hover:bg-blue-50 border border-transparent hover:border-blue-600 rounded-md transition-colors duration-150"
      :title="title"
      @click="($event) => $emit('click', $event)"
    >
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
<style scoped></style>
