<template>
  <section class="object-viewer relative flex flex-col">
    <h2 class="sr-only">Object Viewer</h2>
    <AddToEmbeddedPluginButton
      v-if="isInEmbedMode"
      :fileHandlerId="fileHandlerId"
    />
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
import AddToEmbeddedPluginButton from "./AddToEmbeddedPluginButton.vue";
import { useElevatorSessionStorage } from "@/helpers/useElevatorSessionStorage";

const { isInEmbedMode } = useElevatorSessionStorage();

defineProps<{
  fileHandlerId: string | null;
}>();
</script>
<style scoped></style>
