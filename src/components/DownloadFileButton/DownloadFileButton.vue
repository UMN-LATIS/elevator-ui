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
    :isOpen="isOpen"
    class="max-w-sm"
    @close="isOpen = false">
    <div v-if="isDownloadFileInfoReady">
      <span v-if="!downloadFileInfo">No Downloads available</span>
      <ul v-else class="max-w-sm">
        <template v-for="download in downloadFileInfo" :key="download.filetype">
          <a
            v-if="download.isReady || download.filetype === 'original'"
            :href="download.url"
            class="py-2 hover:bg-transparent-black-50 border-t last:border-b block hover:no-underline group"
            :download="`${download.originalFilename}-${download.filetype}.${download.extension}`"
            @click="
              analytics.trackDownloadEvent({
                fileObjectId: props.fileObjectId,
                assetId: props.assetId,
                fileType: download.filetype,
              })
            ">
            <li class="flex justify-between">
              <span class="group-hover:underline">{{ download.filetype }}</span>
              <Chip class="group-hover:bg-blue-100 group-hover:text-blue-600">
                {{ download.extension }}
              </Chip>
            </li>
          </a>
        </template>
      </ul>
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

const props = defineProps<{
  fileObjectId: string;
  assetId: string;
}>();

const analytics = useAnalytics();
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
    props.fileObjectId,
    props.assetId
  );
}
</script>
<style scoped></style>
