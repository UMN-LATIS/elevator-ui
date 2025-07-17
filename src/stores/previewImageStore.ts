import { defineStore } from "pinia";
import * as Type from "@/types";
import config from "@/config";
import api from "@/api";
import { watch } from "vue";
import { isNotNil } from "ramda";
import invariant from "tiny-invariant";

type FileId = string;

export const usePreviewImageStore = defineStore("previewImages", {
  state: () => ({
    imageReadyMap: new Map<FileId, boolean>(),
    isPollingForUpdates: false,
    pollPeriod: 4000, // milliseconds
    timeoutId: null as ReturnType<typeof setTimeout> | null,
    isInitialized: false,
  }),
  getters: {
    isImageReady(state) {
      return (fileId: Type.UploadWidgetContent["fileId"]): boolean => {
        const isReady = state.imageReadyMap.get(fileId);
        invariant(
          isNotNil(isReady),
          `File ID ${fileId} is not registered in the preview image store.`
        );
        return isReady;
      };
    },
    getPreviewImageUrl() {
      return (fileId: Type.UploadWidgetContent["fileId"]): string => {
        const isReady = this.isImageReady(fileId);
        // adding query param to force browser to reload the
        // image if the state has changed.
        // if the image isn't ready, the backend will return a
        // placeholder image, which we don't want to cache.
        return `${config.instance.base.url}/fileManager/previewImageByFileId/${fileId}/true?isReady=${isReady}`;
      };
    },
    imagesToCheck: (state) => {
      return Array.from(state.imageReadyMap.keys()).filter(
        (fileId) => !state.imageReadyMap.get(fileId)
      );
    },
  },
  actions: {
    init() {
      if (this.isInitialized) return;
      this.isInitialized = true;
      watch(() => this.imagesToCheck, this.pollForUpdates, {
        immediate: true,
      });
    },
    registerFileId(fileId: string) {
      if (this.imageReadyMap.has(fileId)) return;
      this.imageReadyMap.set(fileId, false);
    },
    pollForUpdates() {
      if (this.isPollingForUpdates) return;
      this.isPollingForUpdates = true;

      const poll = async () => {
        // if no files to check, stop polling
        if (this.imagesToCheck.length === 0) {
          this.isPollingForUpdates = false;
          if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
          }
          return;
        }
        const results = await api.checkPreviewImages(this.imagesToCheck);

        results.forEach(({ fileId, status }) => {
          const isReady = status === "true";
          this.imageReadyMap.set(fileId, isReady);
        });

        this.timeoutId = setTimeout(poll, this.pollPeriod);
      };

      poll();
    },
  },
});
