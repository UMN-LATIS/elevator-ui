<template>
  <section class="object-viewer">
    <h2 class="sr-only">Object Viewer</h2>
    <iframe
      v-if="fileHandlerId"
      class="object-viewer__iframe w-full h-full min-h-[20rem]"
      :src="`${config.instance.base.url}/asset/getEmbed/${fileHandlerId}`"
      frameBorder="0"
      allowfullscreen="true"
      @load="onIframeLoad"
    ></iframe>
    <div
      v-else
      class="w-full h-full min-h-[20rem] bg-neutral-400 place-items-center p-8"
    >
      <p>No asset file found.</p>
      <code class="text-sm">FileHandlerId: {{ fileHandlerId ?? "null" }}</code>
    </div>
  </section>
</template>

<script setup lang="ts">
import config from "@/config";

defineProps<{
  fileHandlerId: string | null;
}>();

const emit = defineEmits<{
  (eventName: "objectViewLoad");
}>();

function onIframeLoad() {
  emit("objectViewLoad");
}
</script>
<style scoped>
.object-viewer {
  background: var(--app-objectViewer-backgroundColor);
}
</style>
