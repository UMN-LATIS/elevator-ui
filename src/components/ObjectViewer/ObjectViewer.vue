<template>
  <section class="object-viewer relative flex flex-col">
    <h2 class="sr-only">Object Viewer</h2>
    <div class="flex justify-end items-center gap-2 py-2">
      <Button
        v-if="embeddedPlugin"
        class="block text-sm p-2"
        variant="primary"
        @click="handleAddToPlugin"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="w-5 h-5"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M12 4.5v15m7.5-7.5h-15"
          />
        </svg>
        Add to {{ embeddedPlugin }}
      </Button>
    </div>
    <iframe
      v-if="fileHandlerId"
      class="object-viewer__iframe w-full flex-1"
      :src="`${config.instance.base.url}/asset/getEmbed/${fileHandlerId}`"
      frameBorder="0"
      allowfullscreen="true"
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
import Button from "@/components/Button/Button.vue";
import api from "@/helpers/api";
import { useSessionStorage } from "@vueuse/core";

const props = defineProps<{
  fileHandlerId: string | null;
}>();

const embeddedPlugin = useSessionStorage("embeddedPlugin", null);

function handleAddToPlugin() {
  if (!props.fileHandlerId) return;
  api.addToPlugin(props.fileHandlerId, { elevatorPlugin: embeddedPlugin });
}
</script>
<style scoped>
.object-viewer {
  background: var(--app-objectViewer-backgroundColor);
}
</style>
