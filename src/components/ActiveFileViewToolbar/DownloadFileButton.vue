<template>
  <Tooltip>
    <ActiveFileViewButton @click="handleDownloadFileClick">
      download
    </ActiveFileViewButton>
    <template #content>
      <h2 class="text-sm uppercase text-neutral-400 pb-2 border-b mb-4">
        File Downloads
      </h2>
      <div v-if="isDownloadFileInfoReady">
        <span v-if="!downloadFileInfo">No Downloads available</span>
        <ul v-if="downloadFileInfo">
          <li v-if="downloadFileInfo.screen?.ready">
            <a
              :href="`${config.baseUrl}/fileManager/getDerivativeById/${assetStore.activeFileObjectId}/screen`"
            >
              Download Derivative ({{
                getExtensionFromFilename(
                  downloadFileInfo.screen.originalFilename
                )
              }})
            </a>
          </li>
        </ul>
      </div>
    </template>
  </Tooltip>
</template>
<script setup lang="ts">
import { ref, computed } from "vue";
import Tooltip from "@/components/Tooltip/Tooltip.vue";
import ActiveFileViewButton from "./ActiveFileViewButton.vue";
import { useAssetStore } from "@/stores/assetStore";
import { FileDownloadResponse } from "@/types/FileDownloadTypes";
import api from "@/helpers/api";
import config from "@/config";

const assetStore = useAssetStore();
const isShowingDownloadOptions = ref(false);
const downloadFileInfo = ref<FileDownloadResponse | null | undefined>(
  undefined
);
const isDownloadFileInfoReady = computed(
  () => downloadFileInfo.value !== undefined
);

const getExtensionFromFilename = (filename) => {
  const parts = filename.split(".");
  return parts[parts.length - 1]; // last extension
};

async function handleDownloadFileClick() {
  isShowingDownloadOptions.value = !isShowingDownloadOptions.value;
  downloadFileInfo.value = undefined; // undef means we're fetching
  downloadFileInfo.value = await api.getFileDownloadInfo(
    assetStore.activeFileObjectId,
    assetStore.activeAssetId
  );
}
</script>
<style scoped></style>
