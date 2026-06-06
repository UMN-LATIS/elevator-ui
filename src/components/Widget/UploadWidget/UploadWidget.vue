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
            @click="handleDownloadAll({ preferOriginals: true })">
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
import {
  UploadWidgetDef,
  UploadWidgetContent,
  FileDownloadNormalized,
} from "@/types";
import config from "@/config";
import { useAssetStore } from "@/stores/assetStore";
import ThumbnailImage from "@/components/ThumbnailImage/ThumbnailImage.vue";
import Tooltip from "@/components/Tooltip/Tooltip.vue";
import { computed, onMounted, onBeforeUnmount, ref } from "vue";
import Tuple from "@/components/Tuple/Tuple.vue";
import { SpinnerIcon, VerticalDotsIcon } from "@/icons";
import DropDown from "@/components/DropDown/DropDown.vue";
import DropDownItem from "@/components/DropDown/DropDownItem.vue";
import api from "@/api";
import {
  triggerBrowserDownload,
  isFileDownloadable,
} from "@/helpers/fileDownload";
import { useToastStore } from "@/stores/toastStore";

const props = defineProps<{
  widget: UploadWidgetDef;
  contents: UploadWidgetContent[];
}>();

const assetStore = useAssetStore();

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

function getPreferredDownloadInfo(
  downloadInfo: FileDownloadNormalized[],
  { preferOriginals = false } = {}
): FileDownloadNormalized | null {
  // Originals don't carry isReady/isDownloadable flags, so match on filetype.
  if (preferOriginals) {
    const original = downloadInfo.find((file) => file.filetype === "original");
    if (original) return original;
  }

  // otherwise the first ready, downloadable derivative
  return (
    downloadInfo.find((file) => file.isDownloadable && file.isReady) ?? null
  );
}

const toastStore = useToastStore();

async function handleDownloadAll({ preferOriginals = false } = {}) {
  if (isDownloadingAll.value) return;

  isDownloadingAll.value = true;
  // snapshot the assetId in case it changes during the download process
  const assetId = assetStore.activeAssetId;

  for (const content of props.contents) {
    const fileId = content.fileId;
    const downloadInfo = await api.getFileDownloadInfo(fileId, assetId);

    const preferredDownloadInfo = downloadInfo
      ? getPreferredDownloadInfo(downloadInfo, { preferOriginals })
      : null;

    if (!preferredDownloadInfo) {
      toastStore.addToast({
        message: `No downloadable file found for ${fileId}. Skipping.`,
        variant: "error",
      });
      continue;
    }

    const filename = `${fileId}-${preferredDownloadInfo.filetype}.${preferredDownloadInfo.extension}`;

    isFileDownloadable(preferredDownloadInfo.url)
      .then((isDownloadable) => {
        if (isDownloadable) {
          triggerBrowserDownload(preferredDownloadInfo.url, filename);
        } else {
          toastStore.addToast({
            message: `File ${fileId} is being restored from Glacier. It will be emailed to you when ready.`,
          });
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
