import { defineStore } from "pinia";
import * as Type from "@/types";
import config from "@/config";
import api from "@/api";
import { watch } from "vue";

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
    isImageReady: (state) => {
      return (fileId: Type.UploadWidgetContent["fileId"]) => {
        return state.imageReadyMap.get(fileId) ?? false;
      };
    },
    getPreviewImageUrl: (state) => {
      return (fileId: Type.UploadWidgetContent["fileId"]) => {
        // if we don't have this id in the map, add it
        if (!state.imageReadyMap.has(fileId)) {
          state.imageReadyMap.set(fileId, false);
        }

        const isReady = state.imageReadyMap.get(fileId);
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
