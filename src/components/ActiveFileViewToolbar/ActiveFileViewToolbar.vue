<template>
  <div class="object-toolbar">
    <div class="flex justify-between items-center w-full px-4 py-2">
      <div class="flex gap-1 items-center leading-none">
        <MoreFileInfoButton
          v-if="fileHandlerId"
          :fileObjectId="fileHandlerId"
        />
        <DownloadFileButton
          v-if="assetId && fileHandlerId"
          :assetId="assetId"
          :fileObjectId="fileHandlerId"
        />
        <ShareFileButton v-if="fileHandlerId" :fileObjectId="fileHandlerId" />
        <AddToDrawerButton
          v-if="instanceStore.currentUser?.canManageDrawers && assetId"
          :assetId="assetId"
        />
        <AddToEmbeddedPluginButton
          v-if="isInEmbedMode"
          :fileHandlerId="fileHandlerId"
        />
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import MoreFileInfoButton from "@/components/MoreFileInfoButton/MoreFileInfoButton.vue";
import DownloadFileButton from "@/components/DownloadFileButton/DownloadFileButton.vue";
import ShareFileButton from "@/components/ShareFileButton/ShareFileButton.vue";
import AddToDrawerButton from "@/components/AddToDrawerButton/AddToDrawerButton.vue";
import AddToEmbeddedPluginButton from "../AddToEmbeddedPluginButton/AddToEmbeddedPluginButton.vue";
import { useElevatorSessionStorage } from "@/helpers/useElevatorSessionStorage";
import { useInstanceStore } from "@/stores/instanceStore";

defineProps<{
  fileHandlerId: string | null;
  assetId: string | null;
}>();

const instanceStore = useInstanceStore();
const { isInEmbedMode } = useElevatorSessionStorage();
</script>
<style scoped></style>
