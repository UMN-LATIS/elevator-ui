import { defineStore } from "pinia";
import * as Type from "@/types";
import config from "@/config";
import { computed, reactive, watchEffect } from "vue";
import { isNotNil } from "ramda";
import invariant from "tiny-invariant";
import { usePreviewImagesQuery } from "@/queries/usePreviewImagesQuery";

type FileId = Type.UploadWidgetContent["fileId"];

export const usePreviewImageStore = defineStore("previewImages", () => {
  const imageReadyMap = reactive<Map<FileId, boolean>>(new Map());

  const isImageReady = (fileId: FileId): boolean => {
    const isReady = imageReadyMap.get(fileId);
    invariant(
      isNotNil(isReady),
      `File ID ${fileId} is not registered in the preview image store.`
    );
    return isReady;
  };

  const getPreviewImageUrl = (fileId: FileId): string => {
    const isReady = isImageReady(fileId);
    // adding query param to force browser to reload the
    // image if the state has changed.
    // if the image isn't ready, the backend will return a
    // placeholder image, which we don't want to cache.
    return `${config.instance.base.url}/fileManager/previewImageByFileId/${fileId}/true?isReady=${isReady}`;
  };

  const imagesToCheck = computed(() => {
    return Array.from(imageReadyMap.keys()).filter(
      (fileId) => !imageReadyMap.get(fileId)
    );
  });

  const { data: previewResults } = usePreviewImagesQuery(imagesToCheck);

  // Update imageReadyMap when query results change
  watchEffect(() => {
    if (previewResults.value) {
      previewResults.value.forEach(({ fileId, status }) => {
        imageReadyMap.set(fileId, status === "true");
      });
    }
  });

  const registerFileId = (fileId: string) => {
    if (imageReadyMap.has(fileId)) return;
    imageReadyMap.set(fileId, false);
  };

  return {
    imageReadyMap,
    isImageReady,
    getPreviewImageUrl,
    registerFileId,
  };
});
