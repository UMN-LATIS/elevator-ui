<template>
  <ActiveFileViewButton @click="handleDownloadFileClick">
    <DownloadIcon />
  </ActiveFileViewButton>
  <Modal label="File Downloads" :isOpen="isOpen" @close="isOpen = false">
    <div v-if="isDownloadFileInfoReady">
      <span v-if="!downloadFileInfo">No Downloads available</span>
      <ul v-if="downloadFileInfo">
        <li v-if="downloadFileInfo.screen?.ready">
          <a
            :href="`${config.instance.base.url}/fileManager/getDerivativeById/${assetStore.activeFileObjectId}/screen`"
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
  </Modal>
</template>
<script setup lang="ts">
import { ref, computed } from "vue";
import ActiveFileViewButton from "./ActiveFileViewButton.vue";
import { useAssetStore } from "@/stores/assetStore";
import { FileDownloadResponse } from "@/types/FileDownloadTypes";
import DownloadIcon from "@/icons/DownloadIcon.vue";
import api from "@/helpers/api";
import config from "@/config";
import Modal from "../Modal/Modal.vue";

const assetStore = useAssetStore();
const isOpen = ref(false);
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
  isOpen.value = true;
  downloadFileInfo.value = undefined; // undef means we're fetching
  downloadFileInfo.value = await api.getFileDownloadInfo(
    assetStore.activeFileObjectId,
    assetStore.activeAssetId
  );
}
</script>
<style scoped></style>
