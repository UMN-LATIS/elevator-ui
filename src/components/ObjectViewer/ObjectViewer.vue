<template>
  <section class="object-viewer relative flex flex-col">
    <h2 class="sr-only">Object Viewer</h2>
    <iframe
      v-if="fileHandlerId"
      class="object-viewer__iframe w-full flex-1"
      :style="`background: ${iframeBackground}`"
      :src="`${config.instance.base.url}/asset/getEmbed/${fileHandlerId}/${
        parentAssetId ?? ''
      }`"
      frameBorder="0"
      allowfullscreen="true"></iframe>
    <div
      v-else
      class="w-full h-full min-h-[20rem] bg-surface-container place-items-center p-8">
      <p>No asset file found.</p>
      <code class="text-sm">FileHandlerId: {{ fileHandlerId ?? "null" }}</code>
    </div>
  </section>
</template>

<script setup lang="ts">
import config from "@/config";
import { useTheming } from "@/helpers/useTheming";
import { computed, ref, watch } from "vue";

withDefaults(
  defineProps<{
    fileHandlerId: string | null;
    parentAssetId?: string | null;
  }>(),
  {
    parentAssetId: null,
  }
);

// use the same background color for the iframe as the current theme
// to prevent jarring white background when loading assets in dark mode
const theme = useTheming();
const iframeBackground = ref("white");
// recalcuate iframe background when theme changes
watch(
  theme.activeTheme,
  () => {
    const surfaceContainerColor = getComputedStyle(
      document.documentElement
    ).getPropertyValue("--surface-container");
    iframeBackground.value = surfaceContainerColor || "white";
  },
  { immediate: true }
);
</script>
<style scoped>
.object-viewer {
  background-color: var(--surface-container);
}
</style>
