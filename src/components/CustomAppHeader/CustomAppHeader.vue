<template>
  <div class="custom-app-header bg-transparent-black-100">
    <SanitizedHTML
      :html="htmlWithoutScripts"
      :addTags="['style', 'link']"
      class="w-full" />
  </div>
</template>
<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted } from "vue";
import { useInstanceStore } from "@/stores/instanceStore";
import { useScripts } from "@/composables/useScripts";
import SanitizedHTML from "../SanitizedHTML/SanitizedHTML.vue";

const instanceStore = useInstanceStore();

const rawHtml = computed(() => instanceStore?.customHeader ?? "");

const scripts = useScripts();

const htmlWithoutScripts = computed(() =>
  scripts.stripScriptsFromHtml(rawHtml.value)
);

onMounted(async () => {
  // run any scripts found in the custom header HTML
  await nextTick();
  scripts.run(rawHtml.value);
});

onUnmounted(() => {
  // clean up any scripts added by the custom header HTML
  scripts.cleanup();
});
</script>
<style scoped></style>
