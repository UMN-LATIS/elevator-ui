<template>
  <!-- eslint-disable-next-line vue/no-v-html -->
  <div ref="containerRef" v-html="sanitizedHtml" />
</template>
<script setup lang="ts">
import DOMPurify from "dompurify";
import { uniq } from "ramda";
import {
  computed,
  onMounted,
  useTemplateRef,
  nextTick,
  onBeforeUnmount,
} from "vue";

const props = withDefaults(
  defineProps<{
    html: string;
    removeInlineStyles?: boolean;
    addTags?: string[];
    allowScripts?: boolean;
  }>(),
  {
    removeInlineStyles: false,
    addTags: () => [],
    allowScripts: false,
  }
);

const emit = defineEmits<{
  (e: "contentLoaded"): void;
  (e: "imagesLoaded"): void;
}>();

const containerRef = useTemplateRef<HTMLDivElement | null>("containerRef");

const sanitizeConfig = {
  FORBID_ATTR: props.removeInlineStyles ? ["style"] : [],
  ADD_TAGS: uniq(["iframe", ...props.addTags]),
  // needed for <style> tags
  // https://github.com/cure53/DOMPurify/issues/257#issuecomment-346384997
  FORCE_BODY: props.addTags?.includes("style"),
};

const sanitizedHtml = computed(() => {
  return DOMPurify.sanitize(props.html, sanitizeConfig);
});

const runningScripts: HTMLScriptElement[] = [];

function getScriptsFromHtml(html: string): HTMLScriptElement[] {
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;

  const scriptNodeList = tempDiv.querySelectorAll("script");
  return Array.from(scriptNodeList);
}

function cleanupScripts() {
  runningScripts.forEach((script) => {
    if (script.parentNode) {
      script.parentNode.removeChild(script);
    }
  });
  runningScripts.splice(0, runningScripts.length);
}

function runScripts(html: string) {
  const scripts = getScriptsFromHtml(html);
  scripts.forEach(async (originalScript) => {
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
    runningScripts.push(script);
  });
}

onMounted(async () => {
  // wait for dom updates
  await nextTick();
  emit("contentLoaded");

  if (!props.allowScripts) return;

  const container = containerRef.value;
  if (!container) {
    throw new Error("Container ref is null");
  }

  // cleanup any previous running scripts
  // adding this in case we change to a watcher
  cleanupScripts();

  // get images
  const images = Array.from(
    containerRef.value.querySelectorAll<HTMLImageElement>("img")
  );

  await Promise.allSettled(
    images.map((img) => {
      if (img.complete) return Promise.resolve();
      return new Promise<void>((resolve, reject) => {
        img.addEventListener("load", () => resolve());
        img.addEventListener("error", () => {
          console.warn("Image failed to load:", img.src);
          reject();
        });
      });
    })
  );
  runScripts(props.html);

  // emit after scripts run
  emit("imagesLoaded");
});

onBeforeUnmount(() => {
  cleanupScripts();
});
</script>
