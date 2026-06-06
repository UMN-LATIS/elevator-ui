<template>
  <IconButton
    class="download-file-button"
    title="Download File"
    @click="handleDownloadIconClick">
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
  <Modal
    :isOpen="!!downloadExceptionModalHtml"
    class="max-w-md"
    @close="downloadExceptionModalHtml = ''">
    <div class="prose prose-h1:text-lg">
      <SanitizedHTML :html="downloadExceptionModalHtml" />
    </div>
  </Modal>
</template>
<script setup lang="ts">
import { ref, computed } from "vue";
import IconButton from "@/components/IconButton/IconButton.vue";
import { FileDownloadNormalized } from "@/types";
import DownloadIcon from "@/icons/DownloadIcon.vue";
import api from "@/api";
import Modal from "@/components/Modal/Modal.vue";
import Chip from "@/components/Chip/Chip.vue";
import { useAnalytics } from "@/helpers/useAnalytics";
import { downloadOriginalFile } from "@/helpers/fileDownload";
import { useToastStore } from "@/stores/toastStore";
import SanitizedHTML from "../SanitizedHTML/SanitizedHTML.vue";

const props = defineProps<{
  fileObjectId: string;
  assetId: string;
}>();

const analytics = useAnalytics();
const toastStore = useToastStore();
const downloadFileInfo = ref<FileDownloadNormalized[] | null | undefined>(
  undefined
);
const isDownloadFileInfoReady = computed(
  () => downloadFileInfo.value !== undefined
);
const isChooseDownloadModalOpen = ref(false);

// sometimes we get html response from server when trying to download a file
// (e.g. it's in Glacier). Show the message instead of triggering the download
const downloadExceptionModalHtml = ref<string>("");

async function handleDownloadIconClick() {
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

  const downloadStatus = await downloadOriginalFile(download.url, filename);

  switch (downloadStatus.status) {
    case "pending":
      // close other modal before opening this one
      isChooseDownloadModalOpen.value = false;
      downloadExceptionModalHtml.value =
        downloadStatus.htmlMessage ||
        // assume restoring from Glacier if we get no message, since that's the most common reason for pending downloads
        "<h1>Give us a moment</h1><p>We're retrieving your file from cold storage. This can take several hours. We'll send you an email when it's ready for download.</p>";
      return;
    case "error": {
      toastStore.addToast({
        message: `Sorry, this file couldn't be downloaded. Error: ${downloadStatus.message}`,
        variant: "error",
      });
      return;
    }
    case "downloading":
      return;
    default:
      // ensure exhaustive switch
      const _exhaustive: never = downloadStatus;
  }
}
</script>
<style scoped></style>
