<template>
  <SanitizedHTML
    :html="htmlWithInstanceHrefs"
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
}>();

const router = useRouter();

const htmlWithInstanceHrefs = computed(() =>
  withInstanceHrefs(props.html, (appPath) => router.resolve(appPath).href)
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
