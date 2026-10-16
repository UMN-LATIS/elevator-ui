<template>
  <!-- eslint-disable-next-line vue/no-v-html -->
  <div ref="containerRef" @click="routeLinkClick" v-html="sanitizedHtml" />
</template>
<script setup lang="ts">
import DOMPurify from "dompurify";
import { computed, ref } from "vue";
import { useInstanceLinks } from "@/composables/useInstanceLinks";

const props = withDefaults(
  defineProps<{
    html: string;
    removeInlineStyles?: boolean;
    addTags?: string[];
    resolveLinks?: boolean;
  }>(),
  {
    removeInlineStyles: false,
    addTags: () => [],
    resolveLinks: false,
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
  return props.resolveLinks
    ? sanitizeWithInstanceHrefs(props.html, sanitizeConfig.value)
    : DOMPurify.sanitize(props.html, sanitizeConfig.value);
});

function routeLinkClick(event: MouseEvent) {
  if (props.resolveLinks) routeInstanceLinkClick(event);
}
</script>
