<template>
  <!-- eslint-disable vue/no-v-html -->
  <div
    ref="containerRef"
    @click="routeInstanceLinkClick"
    v-html="sanitizedHtml" />
</template>
<script setup lang="ts">
import DOMPurify from "dompurify";
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import {
  clickedInstanceLinkPath,
  withInstanceHrefs,
} from "@/helpers/instanceLinks";

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

const router = useRouter();

const sanitizedHtml = computed(() => {
  return withInstanceHrefs(
    DOMPurify.sanitize(props.html, sanitizeConfig.value),
    (appPath) => router.resolve(appPath).href
  );
});

function routeInstanceLinkClick(event: MouseEvent) {
  const appPath = clickedInstanceLinkPath(event);
  if (!appPath) return;

  const route = router.resolve(appPath);
  // routing a catchall match shows the app's 404 for pages the server
  // still renders itself
  if (route.name === "catchall") return;

  event.preventDefault();
  router.push(route);
}
</script>
