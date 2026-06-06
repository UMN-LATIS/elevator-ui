<template>
  <IconButton
    class="download-file-button"
    title="Download File"
    @click="handleDownloadFileClick">
    <DownloadIcon />
    <span class="sr-only">Download File</span>
  </IconButton>
  <Modal
    label="File Downloads"
    :isOpen="isChooseDownloadModalOpen"
    class="max-w-sm"
    @close="isChooseDownloadModalOpen = false">
    <div v-if="isDownloadFileInfoReady">
      <span v-if="!downloadFileInfo">No Downloads available</span>
      <ul v-else class="max-w-sm">
        <template v-for="download in downloadFileInfo" :key="download.filetype">
          <a
            v-if="
              (download.isReady && download.isDownloadable) ||
              download.filetype === 'original'
            "
            :href="download.url"
            class="py-2 hover:bg-outline-variant/50 border-t last:border-b block hover:no-underline group"
            :download="`${download.originalFilename}-${download.filetype}.${download.extension}`"
            @click="handleDownloadClick(download, $event)">
            <li class="flex justify-between">
              <span class="group-hover:underline">{{ download.filetype }}</span>
              <Chip
                class="group-hover:bg-primary-container group-hover:text-on-primary-container">
                {{ download.extension }}
              </Chip>
            </li>
          </a>
        </template>
      </ul>
    </div>
  </Modal>
  <GlacierRestoreModal
    :isOpen="isGlacierModalOpen"
    @close="isGlacierModalOpen = false" />
</template>
<script setup lang="ts">
import { ref, computed } from "vue";
import IconButton from "@/components/IconButton/IconButton.vue";
import { FileDownloadNormalized } from "@/types";
import DownloadIcon from "@/icons/DownloadIcon.vue";
import api from "@/api";
import Modal from "@/components/Modal/Modal.vue";
import Chip from "@/components/Chip/Chip.vue";
import GlacierRestoreModal from "@/components/GlacierRestoreModal/GlacierRestoreModal.vue";
import { useAnalytics } from "@/helpers/useAnalytics";
import {
  isFileDownloadable,
  triggerBrowserDownload,
} from "@/helpers/fileDownload";
import { useToastStore } from "@/stores/toastStore";

const props = defineProps<{
  fileObjectId: string;
  assetId: string;
}>();

const analytics = useAnalytics();
const toastStore = useToastStore();
const isChooseDownloadModalOpen = ref(false);
const isGlacierModalOpen = ref(false);
const downloadFileInfo = ref<FileDownloadNormalized[] | null | undefined>(
  undefined
);
const isDownloadFileInfoReady = computed(
  () => downloadFileInfo.value !== undefined
);

async function handleDownloadFileClick() {
  isChooseDownloadModalOpen.value = true;
  downloadFileInfo.value = undefined; // undef means we're fetching
  downloadFileInfo.value = await api.getFileDownloadInfo(
    props.fileObjectId,
    props.assetId
  );
}

async function handleDownloadClick(
  download: FileDownloadNormalized,
  event: MouseEvent
) {
  analytics.trackDownloadEvent({
    fileObjectId: props.fileObjectId,
    assetId: props.assetId,
    fileType: download.filetype,
  });

  // it's possible for a file to be in cold storage (Glacier) and not
  // downloadable yet. In that case, we want to show a modal instead
  // of triggering the browser download, which would download the HTML
  // error page instead of a fill.

  // derivatives are never in Glacier, so just proceed with download
  if (download.filetype !== "original") {
    return;
  }

  // otherwise, prevent the default download action to check if it's in Glacier
  event.preventDefault();
  const filename = `${download.originalFilename}-${download.filetype}.${download.extension}`;

  isFileDownloadable(download.url)
    .then((isDownloadable) => {
      if (isDownloadable) {
        triggerBrowserDownload(download.url, filename);
      } else {
        isChooseDownloadModalOpen.value = false;
        isGlacierModalOpen.value = true;
      }
    })
    .catch((err) => {
      console.error("Error checking if file is downloadable", err);
      toastStore.addToast({
        message: "Sorry, this file couldn't be downloaded. Please try again.",
        variant: "error",
      });
    });
}
</script>
<style scoped></style>
