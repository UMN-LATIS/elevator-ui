<template>
  <Tuple :label="widget.label" class="widget">
    <template #label-extra>
      <DropDown
        label="More actions"
        labelClass="inline-flex items-center !p-1 bg-black/5 rounded-md"
        :showChevron="false">
        <template #label>
          <VerticalDotsIcon />
          <span class="sr-only">More actions</span>
        </template>
        <DropDownItem>
          <button class="block w-full" @click="handleDownloadAllDerivatives">
            Download All Derivatives
          </button>
        </DropDownItem>
        <!-- <DropDownItem>
          <button>Download All Originals</button>
        </DropDownItem> -->
      </DropDown>
    </template>
    <div class="upload-widget flex gap-2 flex-wrap mt-2">
      <button
        v-for="(content, key) in contents"
        :key="key"
        :title="content.fileDescription"
        class="thumbnail-related-asset-widget flex flex-col rounded-md border border-transparent p-1 no-underline hover:no-underline hover:bg-blue-50 hover:text-blue-600 w-24 text-neutral-600"
        :class="{
          'opacity-80 hover:opacity-100 hover:border-blue-600': !isFileActive(
            content.fileId
          ),
          'ring ring-offset-1 ring-blue-600 hover:border-transparent opacity-100 bg-blue-50':
            isFileActive(content.fileId),
        }"
        @click="assetStore.activeFileObjectId = content.fileId">
        <ThumbnailImage
          :src="`${config.instance.base.url}/fileManager/tinyImageByFileId/${content.fileId}/true`"
          :alt="content.fileDescription"
          :fileType="content.fileType"
          class="thumbnail-related-asset-widget__image max-w-full" />
        <SanitizedHTML
          v-if="content.fileDescription"
          class="whitespace-nowrap text-xs mt-1 truncate overflow-hidden w-full text-center"
          :html="content.fileDescription" />
      </button>
    </div>
  </Tuple>
</template>

<script setup lang="ts">
import {
  UploadWidgetProps,
  UploadWidgetContent,
  FileDownloadNormalized,
} from "@/types";
import config from "@/config";
import { useAssetStore } from "@/stores/assetStore";
import ThumbnailImage from "@/components/ThumbnailImage/ThumbnailImage.vue";
import SanitizedHTML from "@/components/SanitizedHTML/SanitizedHTML.vue";
import { computed, onMounted, onBeforeUnmount } from "vue";
import Tuple from "@/components/Tuple/Tuple.vue";
import { VerticalDotsIcon } from "@/icons";
import DropDown from "@/components/DropDown/DropDown.vue";
import DropDownItem from "@/components/DropDown/DropDownItem.vue";
import api from "@/api";

const props = defineProps<{
  widget: UploadWidgetProps;
  contents: UploadWidgetContent[];
}>();

const assetStore = useAssetStore();

const isFileActive = (fileId: string) =>
  assetStore.activeFileObjectId === fileId;

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

async function downloadFile(url: string, filename: string) {
  try {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.style.display = "none";
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (error) {
    console.error("Error downloading file", error);
    throw error;
  }
}

function getPreferredDownloadInfo(
  downloadInfo: FileDownloadNormalized[]
): FileDownloadNormalized {
  if (!downloadInfo?.length) {
    throw new Error(`No download info found: ${downloadInfo}`);
  }

  // ignore any derivatives that aren't downloadable as files
  // mostly doing this for testing. In prod, this case should
  // rarely happen
  const nonDownloadableTypes = ["dicom", "tiled"];

  const downloadables = downloadInfo.filter(
    (derivative) => !nonDownloadableTypes.includes(derivative.filetype)
  );

  if (downloadables.length < 1) {
    throw new Error(`No downloadable derivatives found: ${downloadables}`);
  }

  // return the first deriv
  return downloadables[0];
}

async function handleDownloadAllDerivatives() {
  console.log("Downloading all derivatives");
  // snapshot the assetId in case it changes during the download process
  const assetId = assetStore.activeAssetId;

  for (const content of props.contents) {
    try {
      const fileId = content.fileId;
      const downloadInfo = await api.getFileDownloadInfo(
        content.fileId,
        assetId
      );

      if (!downloadInfo || downloadInfo.length < 1) {
        console.warn(`No download info found for ${fileId}`);
        continue;
      }
      const { url, filetype, extension } =
        getPreferredDownloadInfo(downloadInfo);

      const filename = `${fileId}-${filetype}.${extension}`;
      await downloadFile(url, filename);
    } catch (error) {
      console.error("Error downloading file. Skipping.", error);
      continue;
    }
  }
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
