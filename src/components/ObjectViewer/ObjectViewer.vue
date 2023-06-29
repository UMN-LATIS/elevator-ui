<template>
  <section class="object-viewer relative flex flex-col">
    <h2 class="sr-only">Object Viewer</h2>
    <div
      class="object-viewer__button-bar flex justify-end items-center gap-2 p-2 border-b"
    >
      <AddToEmbeddedPluginButton
        v-if="isInEmbedMode"
        :fileHandlerId="fileHandlerId"
      />
      <AddToDrawerButton v-if="instanceStore.currentUser?.canManageDrawers" />
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
import AddToEmbeddedPluginButton from "./AddToEmbeddedPluginButton.vue";
import AddToDrawerButton from "./AddToDrawerButton.vue";
import { useElevatorSessionStorage } from "@/helpers/useElevatorSessionStorage";
import { useInstanceStore } from "@/stores/instanceStore";

const instanceStore = useInstanceStore();
const { isInEmbedMode } = useElevatorSessionStorage();

defineProps<{
  fileHandlerId: string | null;
}>();
</script>
<style scoped></style>
