<template>
  <ActiveFileViewButton @click="handleDownloadFileClick">
    <DownloadIcon />
  </ActiveFileViewButton>
  <Modal label="File Downloads" :isOpen="isOpen" @close="isOpen = false">
    <div v-if="isDownloadFileInfoReady">
      <span v-if="!downloadFileInfo">No Downloads available</span>
      <ul v-else class="list-disc list-inside">
        <template v-for="download in downloadFileInfo" :key="download.filetype">
          <li v-if="download.isReady || download.filetype === 'original'">
            <a :href="download.url">
              Download {{ download.filetype }}
              <span
                v-if="
                  download.extension !== download.filetype.toLocaleLowerCase()
                "
              >
                ({{ download.extension }})
              </span>
            </a>
          </li>
        </template>
      </ul>
    </div>
  </Modal>
</template>
<script setup lang="ts">
import { ref, computed } from "vue";
import ActiveFileViewButton from "./ActiveFileViewButton.vue";
import { useAssetStore } from "@/stores/assetStore";
import { FileDownloadNormalized } from "@/types";
import DownloadIcon from "@/icons/DownloadIcon.vue";
import api from "@/api";
import Modal from "../Modal/Modal.vue";

const assetStore = useAssetStore();
const isOpen = ref(false);
const downloadFileInfo = ref<FileDownloadNormalized[] | null | undefined>(
  undefined
);
const isDownloadFileInfoReady = computed(
  () => downloadFileInfo.value !== undefined
);

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
