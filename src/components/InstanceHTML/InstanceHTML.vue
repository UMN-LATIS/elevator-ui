<template>
  <SanitizedHTML
    :html="htmlWithInstanceHrefs"
    :removeInlineStyles="removeInlineStyles"
    :addTags="addTags"
    @click="routeInstanceLinkClick" />
</template>
<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import SanitizedHTML from "@/components/SanitizedHTML/SanitizedHTML.vue";
import {
  clickedInstanceLinkPath,
  withInstanceHrefs,
} from "@/helpers/instanceLinks";

const props = defineProps<{
  html: string;
  removeInlineStyles?: boolean;
  addTags?: string[];
}>();

const router = useRouter();

const htmlWithInstanceHrefs = computed(() =>
  withInstanceHrefs(props.html, (appPath) =>
    router.options.history.createHref(appPath)
  )
);

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
