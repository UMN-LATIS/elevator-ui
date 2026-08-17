<template>
  <div class="active-file-view-toolbar">
    <div class="flex justify-between items-center w-full px-4 py-2">
      <div class="flex gap-1 items-center leading-none">
        <MoreFileInfoButton
          v-if="fileHandlerId"
          :fileObjectId="fileHandlerId"
          :assetId="assetId" />
        <DownloadFileButton
          v-if="assetId && fileHandlerId"
          :assetId="assetId"
          :fileObjectId="fileHandlerId" />
        <ShareFileButton
          v-if="fileHandlerId"
          :fileObjectId="fileHandlerId"
          :embedTitle="embedTitle" />
        <AddToDrawerButton
          v-if="currentUser?.canManageDrawers && assetId"
          :assetId="assetId" />
        <AddToEmbeddedPluginButton
          v-if="isInEmbedMode"
          :fileHandlerId="fileHandlerId" />
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
import { useAssetStore } from "@/stores/assetStore";
import { computed } from "vue";
import { useCurrentUser } from "@/composables/useCurrentUser";

defineProps<{
  fileHandlerId: string | null;
  assetId: string | null;
}>();

const assetStore = useAssetStore();
const { isInEmbedMode } = useElevatorSessionStorage();
const { currentUser } = useCurrentUser();

// titles the copyable embed snippet's iframe
const embedTitle = computed(
  () =>
    assetStore.activeFileDescription ||
    assetStore.activeTitle ||
    "Embedded asset"
);
</script>
<style scoped></style>
