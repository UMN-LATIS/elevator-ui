import { usePreviewImageStore } from "@/stores/previewImageStore";

// this composable provides a nicer interface for using the
// preview image store. So that we don't need to init polling,
// or register file ids in the components that use it.
export const usePreviewImage = (fileId: string) => {
  const store = usePreviewImageStore();

  store.init();
  store.registerFileId(fileId);

  const isReady = store.isImageReady(fileId);
  const previewImageUrl = store.getPreviewImageUrl(fileId);

  return {
    isReady,
    previewImageUrl,
  };
};
