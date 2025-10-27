<template>
  <footer
    v-if="instanceStore.customFooter"
    class="app-footer bg-transparent-black-100">
    <SanitizedHTML :html="htmlWithoutScripts" :addTags="['style', 'link']" />
  </footer>
</template>
<script setup lang="ts">
import { onMounted, computed, nextTick, onUnmounted } from "vue";
import { useInstanceStore } from "@/stores/instanceStore";
import SanitizedHTML from "../SanitizedHTML/SanitizedHTML.vue";
import { useScripts } from "@/composables/useScripts";

const instanceStore = useInstanceStore();

const rawHtml = computed(() => instanceStore?.customFooter ?? "");

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
<style scoped>
.app-footer {
  border-top: var(--app-borderWidth) solid var(--app-borderColor);
}
</style>
