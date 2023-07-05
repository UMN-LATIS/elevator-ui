<template>
  <div class="object-toolbar">
    <div class="flex justify-between items-center w-full px-4 py-2">
      <div class="flex gap-1 items-center leading-none">
        <MoreFileInfoButton />
        <DownloadFileButton />
        <ShareButton />
        <AddToDrawerButton v-if="instanceStore.currentUser?.canManageDrawers" />
        <AddToEmbeddedPluginButton
          v-if="isInEmbedMode"
          :fileHandlerId="fileHandlerId"
        />
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import MoreFileInfoButton from "./MoreFileInfoButton.vue";
import DownloadFileButton from "./DownloadFileButton.vue";
import ShareButton from "./ShareButton.vue";
import AddToDrawerButton from "@/components/AddToDrawerButton/AddToDrawerButton.vue";
import AddToEmbeddedPluginButton from "../AddToEmbeddedPluginButton/AddToEmbeddedPluginButton.vue";
import { useElevatorSessionStorage } from "@/helpers/useElevatorSessionStorage";
import { useInstanceStore } from "@/stores/instanceStore";

defineProps<{
  fileHandlerId: string | null;
}>();

const instanceStore = useInstanceStore();
const { isInEmbedMode } = useElevatorSessionStorage();
</script>
<style scoped></style>
