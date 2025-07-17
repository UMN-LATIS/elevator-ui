import { defineStore } from "pinia";
import * as Type from "@/types";
import config from "@/config";
import api from "@/api";
import { watch, ref, computed, nextTick } from "vue";
import { isNotNil } from "ramda";
import invariant from "tiny-invariant";

type FileId = string;

export const usePreviewImageStore = defineStore("previewImages", () => {
  const imageReadyMap = ref(new Map<FileId, boolean>());
  const isPollingForUpdates = ref(false);
  const pollPeriod = ref(4000); // milliseconds
  const timeoutId = ref<ReturnType<typeof setTimeout> | null>(null);
  const isInitialized = ref(false);

  const isImageReady = (
    fileId: Type.UploadWidgetContent["fileId"]
  ): boolean => {
    const isReady = imageReadyMap.value.get(fileId);
    invariant(
      isNotNil(isReady),
      `File ID ${fileId} is not registered in the preview image store.`
    );
    return isReady;
  };

  const getPreviewImageUrl = (
    fileId: Type.UploadWidgetContent["fileId"]
  ): string => {
    const isReady = isImageReady(fileId);
    // adding query param to force browser to reload the
    // image if the state has changed.
    // if the image isn't ready, the backend will return a
    // placeholder image, which we don't want to cache.
    return `${config.instance.base.url}/fileManager/previewImageByFileId/${fileId}/true?isReady=${isReady}`;
  };

  const imagesToCheck = computed(() => {
    return Array.from(imageReadyMap.value.keys()).filter(
      (fileId) => !imageReadyMap.value.get(fileId)
    );
  });

  const init = () => {
    if (isInitialized.value) return;
    isInitialized.value = true;
    watch(() => imagesToCheck.value, pollForUpdates, {
      immediate: true,
    });
  };

  const registerFileId = (fileId: string) => {
    if (imageReadyMap.value.has(fileId)) return;
    imageReadyMap.value.set(fileId, false);

    // Trigger polling on next tick when computed has updated
    nextTick(() => {
      if (!isPollingForUpdates.value && imagesToCheck.value.length > 0) {
        pollForUpdates();
      }
    });
  };

  const pollForUpdates = () => {
    // Stop any existing polling first
    if (timeoutId.value) {
      clearTimeout(timeoutId.value);
      timeoutId.value = null;
    }

    // If no files to check, just stop polling
    if (imagesToCheck.value.length === 0) {
      isPollingForUpdates.value = false;
      return;
    }

    // Start fresh polling session
    if (isPollingForUpdates.value) return;
    isPollingForUpdates.value = true;

    const poll = async () => {
      // if no files to check, stop polling
      if (imagesToCheck.value.length === 0) {
        isPollingForUpdates.value = false;
        if (timeoutId.value) {
          clearTimeout(timeoutId.value);
          timeoutId.value = null;
        }
        return;
      }

      try {
        const results = await api.checkPreviewImages(imagesToCheck.value);

        results.forEach(({ fileId, status }) => {
          const isReady = status === "true";
          imageReadyMap.value.set(fileId, isReady);
        });
      } catch (error) {
        console.warn("Failed to check preview images:", error);
      }

      // Schedule next poll if still polling
      if (isPollingForUpdates.value && imagesToCheck.value.length > 0) {
        timeoutId.value = setTimeout(poll, pollPeriod.value);
      } else {
        isPollingForUpdates.value = false;
      }
    };

    poll();
  };

  const cleanup = () => {
    if (timeoutId.value) {
      clearTimeout(timeoutId.value);
      timeoutId.value = null;
    }
    isPollingForUpdates.value = false;
  };

  return {
    imageReadyMap,
    isPollingForUpdates,
    pollPeriod,
    timeoutId,
    isInitialized,
    isImageReady,
    getPreviewImageUrl,
    imagesToCheck,
    init,
    registerFileId,
    pollForUpdates,
    cleanup,
  };
});
