<template>
  <!-- eslint-disable-next-line vue/no-v-html -->
  <div v-html="sanitizedHtml" />
</template>
<script setup lang="ts">
import DOMPurify from "dompurify";
import { computed } from "vue";
const props = withDefaults(
  defineProps<{
    html: string;
    removeInlineStyles?: boolean;
  }>(),
  {
    removeInlineStyles: false,
  }
);

const sanitizeConfig = {
  FORBID_ATTR: props.removeInlineStyles ? ["style"] : [],
};

const sanitizedHtml = computed(() =>
  DOMPurify.sanitize(props.html, sanitizeConfig)
);
</script>
