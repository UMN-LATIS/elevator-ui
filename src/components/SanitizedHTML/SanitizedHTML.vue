<template>
  <!-- eslint-disable-next-line vue/no-v-html -->
  <div ref="containerRef" v-html="sanitizedHtml" />
</template>
<script setup lang="ts">
import DOMPurify from "dompurify";
import { computed } from "vue";

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

const sanitizeConfig = {
  FORBID_ATTR: props.removeInlineStyles ? ["style"] : [],
  ADD_TAGS: ["iframe", ...props.addTags],
  // needed for <style> tags
  // https://github.com/cure53/DOMPurify/issues/257#issuecomment-346384997
  FORCE_BODY: props.addTags?.includes("style"),
};

const sanitizedHtml = computed(() => {
  return DOMPurify.sanitize(props.html, sanitizeConfig);
});
</script>
