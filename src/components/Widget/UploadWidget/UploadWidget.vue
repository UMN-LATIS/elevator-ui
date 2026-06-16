<template>
  <Tuple :label="widget.label" class="widget">
    <template v-if="contents.length > 1" #label-extra>
      <DropDown
        label="More actions"
        labelClass="inline-flex items-center !p-1 bg-surface-container-lowest rounded-md"
        :showChevron="false"
        @trigger:click="checkIfCanDownloadOriginals">
        <template v-if="isDownloadingAll" #label>
          <SpinnerIcon />
          <span class="sr-only">Download in progress</span>
        </template>

        <template v-else #label>
          <VerticalDotsIcon />
          <span class="sr-only">More actions</span>
        </template>

        <div
          v-if="canDownloadOriginals === undefined"
          class="p-2 flex justify-center items-center text-sm gap-2">
          <SpinnerIcon />
          Checking permissions...
        </div>

        <div
          v-else-if="isDownloadingAll"
          class="p-2 flex justify-center items-center gap-2 text-sm">
          <SpinnerIcon />
          Downloading all...
        </div>

        <template v-else>
          <DropDownItem @click="handleDownloadAll">
            Download All Derivatives
          </DropDownItem>
          <DropDownItem
            v-if="canDownloadOriginals"
            @click="handleDownloadAllOriginals">
            Download All Originals
          </DropDownItem>
        </template>
      </DropDown>
    </template>
    <div class="upload-widget flex gap-2 flex-wrap mt-2">
      <Tooltip
        v-for="(content, key) in contents"
        :key="key"
        :tip="content.fileDescription">
        <button
          class="thumbnail-related-asset-widget flex flex-col rounded-md border border-transparent p-1 no-underline hover:no-underline w-24"
          :class="{
            'opacity-80 hover:opacity-100': !isFileActive(content.fileId),
            'ring ring-offset-1 is-active hover:border-transparent opacity-100':
              isFileActive(content.fileId),
          }"
          @click="assetStore.activeFileObjectId = content.fileId">
          <ThumbnailImage
            :src="`${config.instance.base.url}/fileManager/tinyImageByFileId/${content.fileId}/true`"
            :alt="content.fileDescription"
            :fileType="content.fileType"
            class="thumbnail-related-asset-widget__image max-w-full" />
        </button>
      </Tooltip>
    </div>
  </Tuple>
</template>

<script setup lang="ts">
import { UploadWidgetDef, UploadWidgetContent } from "@/types";
import config from "@/config";
import { useAssetStore } from "@/stores/assetStore";
import { useToastStore } from "@/stores/toastStore";
import {
  fetchOriginalFileStorageStatus,
  restoreOriginalFile,
} from "@/api/fetchers";
import ThumbnailImage from "@/components/ThumbnailImage/ThumbnailImage.vue";
import Tooltip from "@/components/Tooltip/Tooltip.vue";
import { computed, onMounted, onBeforeUnmount, ref } from "vue";
import Tuple from "@/components/Tuple/Tuple.vue";
import { SpinnerIcon, VerticalDotsIcon } from "@/icons";
import DropDown from "@/components/DropDown/DropDown.vue";
import DropDownItem from "@/components/DropDown/DropDownItem.vue";
import api from "@/api";

const props = defineProps<{
  widget: UploadWidgetDef;
  contents: UploadWidgetContent[];
}>();

const assetStore = useAssetStore();
const toastStore = useToastStore();

const isFileActive = (fileId: string) =>
  assetStore.activeFileObjectId === fileId;
const isDownloadingAll = ref(false);

const activeIndex = computed(() =>
  props.contents.findIndex((content) => isFileActive(content.fileId))
);

const hasActiveFileWithin = computed(() => activeIndex.value !== -1);

function setPrevFileAsActive() {
  const prevFileIndex =
    (activeIndex.value - 1 + props.contents.length) % props.contents.length;
  assetStore.activeFileObjectId = props.contents[prevFileIndex].fileId;
}

function setNextFileAsActive() {
  const nextFileIndex = (activeIndex.value + 1) % props.contents.length;
  assetStore.activeFileObjectId = props.contents[nextFileIndex].fileId;
}

// within a widget, pressing the left or right arrow keys will
// navigate to the previous or next file
function handleNextPrevArrowPresses(event: KeyboardEvent) {
  if (!hasActiveFileWithin.value) return;

  if (event.key === "ArrowLeft") {
    return setPrevFileAsActive();
  }

  if (event.key === "ArrowRight") {
    return setNextFileAsActive();
  }
}

async function downloadFile(url: string, filename: string): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();

      // To address an Network Error issue with Safari, we need to make
      // the timeout long enough to receive the 200 response from the server
      // and start the download. Note: This doesn't need to be long
      // enough to COMPLETE the whole download, just long enough to start.
      // ~2s seems to be a good balance.
      const WAIT_TIME_FOR_DOWNLOAD_RESPONSE = 2000;
      setTimeout(() => {
        link.remove();
        resolve();
      }, WAIT_TIME_FOR_DOWNLOAD_RESPONSE);
    } catch (error) {
      console.error(`Error downloading file: ${url}`, error);
      reject(error);
    }
  });
}

async function handleDownloadAll() {
  if (isDownloadingAll.value) return;

  isDownloadingAll.value = true;
  // snapshot the assetId in case it changes during the download process
  const assetId = assetStore.activeAssetId;

  for (const content of props.contents) {
    try {
      const fileId = content.fileId;
      const downloadInfo = await api.getFileDownloadInfo(
        content.fileId,
        assetId
      );

      if (!downloadInfo) {
        console.warn(
          `No download info found for file ${content.fileId}. Skipping.`
        );
        continue;
      }

      const downloadables = downloadInfo.filter(
        (derivative) => derivative.isDownloadable && derivative.isGenerated
      );

      if (!downloadables.length) {
        console.warn(
          `No downloadable derivatives found for file ${content.fileId}. Skipping.`
        );
        continue;
      }

      const { url, filetype, extension } = downloadables[0];

      const filename = `${fileId}-${filetype}.${extension}`;
      await downloadFile(url, filename);
    } catch (error) {
      console.error(
        `Error downloading file ${content.fileId}. Skipping.`,
        error
      );
      continue;
    }
  }

  isDownloadingAll.value = false;
}

// "Download All Originals" can't trust the embed JSON's downloadable flag for
// an original — a cold one looks the same there. So check each original's live
// storage status first and branch: download the hot ones now, queue a thaw for
// the cold/restoring ones (re-requesting a restore also joins the user to the
// email queue, mirroring DownloadFileButton), or report a status error. Each
// file gets its own toast, named, so the user can see which originals started
// downloading, which are being restored, and which failed. See #546.
async function handleDownloadAllOriginals() {
  if (isDownloadingAll.value) return;

  isDownloadingAll.value = true;
  // snapshot the assetId in case it changes during the download process
  const assetId = assetStore.activeAssetId;

  // how long each per-file toast lingers — long enough to read the filename as
  // the batch streams past
  const TOAST_DURATION = 6000;

  for (const content of props.contents) {
    // a best-effort name for the toasts before the embed JSON loads; refined to
    // the real filename below once we have it
    let name = content.fileDescription || content.fileId;

    try {
      const downloadInfo = await api.getFileDownloadInfo(
        content.fileId,
        assetId
      );
      const original = downloadInfo?.find(
        (derivative) => derivative.filetype === "original"
      );
      if (original?.originalFilename) name = original.originalFilename;

      const { status } = await fetchOriginalFileStorageStatus(content.fileId);

      if (status === "downloadable") {
        if (!original) {
          toastStore.addToast({
            variant: "error",
            message: `Couldn't find an original to download for ${name}.`,
            duration: TOAST_DURATION,
          });
          continue;
        }
        toastStore.addToast({
          variant: "success",
          message: `Download of ${name} started.`,
          duration: TOAST_DURATION,
        });
        const filename = `${content.fileId}-${original.filetype}.${original.extension}`;
        await downloadFile(original.url, filename);
      } else if (status === "archived" || status === "restoring") {
        await restoreOriginalFile(content.fileId);
        toastStore.addToast({
          message: `Restoring ${name} — we'll email you when it's ready to download.`,
          duration: TOAST_DURATION,
        });
      } else {
        // status === "error" (forbidden / notFound)
        toastStore.addToast({
          variant: "error",
          message: `Couldn't check the status of ${name}.`,
          duration: TOAST_DURATION,
        });
      }
    } catch (error) {
      console.error(
        `Error downloading original for file ${content.fileId}.`,
        error
      );
      toastStore.addToast({
        variant: "error",
        message: `Couldn't download ${name}.`,
        duration: TOAST_DURATION,
      });
    }
  }

  isDownloadingAll.value = false;
}

const canDownloadOriginals = ref<boolean | undefined>();

// we're doing a check on menu trigger since it's very rare
// that someone will want to download all files
async function checkIfCanDownloadOriginals() {
  // if we already have a defined value, don't bother
  if (canDownloadOriginals.value !== undefined) return;

  // otherwise
  // get the first content's download info
  // and see if it has an original
  if (!props.contents.length) {
    canDownloadOriginals.value = false;
    return;
  }

  const firstContent = props.contents[0];

  const downloadInfo = await api.getFileDownloadInfo(
    firstContent.fileId,
    assetStore.activeAssetId
  );

  if (!downloadInfo || downloadInfo.length < 1) {
    canDownloadOriginals.value = false;
    return;
  }

  const original = downloadInfo.find(
    (derivative) => derivative.filetype === "original"
  );

  canDownloadOriginals.value = !!original;
}

onMounted(() => {
  // if there aren't multiple files, don't bother
  // listening for arrow key presses
  if (props.contents.length < 2) return;
  window.addEventListener("keydown", handleNextPrevArrowPresses);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", handleNextPrevArrowPresses);
});
</script>
<style scoped>
.upload-widget button:hover,
.upload-widget button:focus,
.upload-widget button.is-active {
  --tw-ring-color: var(--primary);

  /* slightly darker bg on hover to indicate interactivity */
  background-color: var(--primary-container);

  color: var(--primary);
}
</style>
