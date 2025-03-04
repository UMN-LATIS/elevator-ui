<template>
  <div>
    <Button variant="tertiary" class="-ml-2" @click="handleDownloadAllFiles">
      Download All Files
      <SpinnerIcon v-if="isDownloading" class="ml-2" />
    </Button>
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
  </div>
</template>

<script setup lang="ts">
import { UploadWidgetProps, UploadWidgetContent } from "@/types";
import config from "@/config";
import { useAssetStore } from "@/stores/assetStore";
import ThumbnailImage from "@/components/ThumbnailImage/ThumbnailImage.vue";
import SanitizedHTML from "@/components/SanitizedHTML/SanitizedHTML.vue";
import { computed, onMounted, onBeforeUnmount } from "vue";
import Button from "@/components/Button/Button.vue";
import { useFileDownloader } from "@/helpers/downloadFileObjects";
import { SpinnerIcon } from "@/icons";

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

const { isDownloading, downloadAssetFiles } = useFileDownloader();

async function handleDownloadAllFiles() {
  const assetId = assetStore.activeAssetId;

  if (!assetId) {
    throw new Error("Cannot download all: No assetId found");
  }

  downloadAssetFiles(
    assetId,
    props.contents.map((c) => c.fileId)
  );
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
