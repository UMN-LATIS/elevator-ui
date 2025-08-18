<template>
  <!-- eslint-disable-next-line vue/no-v-html -->
  <div ref="containerRef" v-html="htmlWithoutScripts" />
</template>
<script setup lang="ts">
import DOMPurify from "dompurify";
import { computed, onMounted, ref, watch, onUnmounted, type Ref } from "vue";

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
const addedScripts: Ref<HTMLScriptElement[]> = ref([]);

const sanitizeConfig = {
  FORBID_ATTR: props.removeInlineStyles ? ["style"] : [],
  ADD_TAGS: ["iframe", "script", ...props.addTags],
  // needed for <style> tags
  // https://github.com/cure53/DOMPurify/issues/257#issuecomment-346384997
  FORCE_BODY: props.addTags?.includes("style"),
};

const sanitizedHtml = computed(() => {
  return DOMPurify.sanitize(props.html, sanitizeConfig);
});

const htmlWithoutScripts = computed(() => {
  // Create a temporary DOM element to parse the sanitized HTML
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = sanitizedHtml.value;

  // Remove all script tags from the HTML
  const scripts = tempDiv.querySelectorAll("script");
  scripts.forEach((script) => script.remove());

  return tempDiv.innerHTML;
});

const extractAndExecuteScripts = () => {
  // Clean up previously added scripts
  cleanupScripts();

  // Create a temporary DOM element to parse the sanitized HTML
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = sanitizedHtml.value;

  // Find all script tags
  const scripts = tempDiv.querySelectorAll("script");

  scripts.forEach((originalScript) => {
    const script = document.createElement("script");

    // Copy attributes
    Array.from(originalScript.attributes).forEach((attr) => {
      script.setAttribute(attr.name, attr.value);
    });

    // Copy content if it's an inline script
    if (originalScript.textContent) {
      script.textContent = originalScript.textContent;
    }

    // Append to body to execute
    document.body.appendChild(script);
    addedScripts.value.push(script);
  });
};

const cleanupScripts = () => {
  // Remove previously added scripts from the document
  addedScripts.value.forEach((script) => {
    if (script.parentNode) {
      script.parentNode.removeChild(script);
    }
  });
  addedScripts.value = [];
};

// Watch for changes in the HTML prop and re-extract scripts
watch(
  () => props.html,
  () => {
    extractAndExecuteScripts();
  },
  { immediate: false }
);

onMounted(() => {
  extractAndExecuteScripts();
});

onUnmounted(() => {
  cleanupScripts();
});
</script>
