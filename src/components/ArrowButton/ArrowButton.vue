<template>
  <component
    :is="componentType"
    class="flex justify-center items-center bg-neutral-100 p-2 rounded-full hover:bg-neutral-900 hover:text-white gap-2 hover:no-underline text-neutral-900 cursor-pointer"
    v-bind="props"
  >
    <slot />
    <Icon>arrow_forward</Icon>
  </component>
</template>
<script setup lang="ts">
import { computed } from "vue";
import Icon from "@/components/Icon/Icon.vue";
import { RouterLink } from "vue-router";

const props = defineProps<{
  to?: string; // for <router-link>
  href?: string; // for <a>
}>();

const componentType = computed(() => {
  if (!!props.to) return RouterLink;
  if (!!props.href) return "a";
  return "button";
});
</script>
<style scoped></style>
