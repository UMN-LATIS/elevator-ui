<template>
  <!-- eslint-disable vue/no-v-html -->
  <div
    ref="containerRef"
    @click="routeInstanceLinkClick"
    v-html="sanitizedHtml" />
</template>
<script setup lang="ts">
import { computed, ref } from "vue";
import { useInstanceLinks } from "@/composables/useInstanceLinks";

const props = withDefaults(
  defineProps<{
    html: string;
    removeInlineStyles?: boolean;
    addTags?: string[];
  }>(),
  {
    removeInlineStyles: false,
    addTags: () => [],
  }
);

const containerRef = ref<HTMLElement>();

const sanitizeConfig = computed(() => ({
  FORBID_ATTR: props.removeInlineStyles ? ["style"] : [],
  // Allow iframe and any additional tags specified, but NOT script
  ADD_TAGS: ["iframe", ...props.addTags],
  // needed for <style> tags
  // https://github.com/cure53/DOMPurify/issues/257#issuecomment-346384997
  FORCE_BODY: props.addTags?.includes("style"),
}));

const { sanitizeWithInstanceHrefs, routeInstanceLinkClick } =
  useInstanceLinks();

const sanitizedHtml = computed(() => {
  return sanitizeWithInstanceHrefs(props.html, sanitizeConfig.value);
});
</script>
