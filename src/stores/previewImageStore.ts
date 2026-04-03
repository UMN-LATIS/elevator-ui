import { defineStore } from "pinia";
import * as Type from "@/types";
import config from "@/config";
import { computed, reactive, watchEffect } from "vue";
import { usePreviewImagesQuery } from "@/queries/usePreviewImagesQuery";

type FileId = Type.UploadWidgetContent["fileId"];

export const usePreviewImageStore = defineStore("previewImages", () => {
  const imageReadyMap = reactive<Map<FileId, boolean>>(new Map());
  const refCountMap = reactive<Map<FileId, number>>(new Map());

  const isImageReady = (fileId: FileId): boolean => {
    return imageReadyMap.get(fileId) ?? false;
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

  // Update imageReadyMap when query results change. Filter out fileIds
  // that were unregistered while the request was in flight — without
  // this, a stale response could re-add the fileId and restart polling.
  watchEffect(() => {
    previewResults.value
      ?.filter(({ fileId }) => refCountMap.has(fileId))
      .forEach(({ fileId, status }) => {
        imageReadyMap.set(fileId, status === "true");
      });
  });

  const registerFileId = (fileId: string) => {
    refCountMap.set(fileId, (refCountMap.get(fileId) ?? 0) + 1);
    if (!imageReadyMap.has(fileId)) {
      imageReadyMap.set(fileId, false);
    }
  };

  const unregisterFileId = (fileId: string) => {
    const count = refCountMap.get(fileId) ?? 0;
    if (count <= 1) {
      refCountMap.delete(fileId);
      imageReadyMap.delete(fileId);
    } else {
      refCountMap.set(fileId, count - 1);
    }
  };

  return {
    imageReadyMap,
    refCountMap,
    isImageReady,
    getPreviewImageUrl,
    registerFileId,
    unregisterFileId,
  };
});
