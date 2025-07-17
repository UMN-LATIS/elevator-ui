import { usePreviewImageStore } from "@/stores/previewImageStore";
import {
  computed,
  watch,
  toValue,
  type MaybeRefOrGetter,
  type ComputedRef,
} from "vue";

// Return type that creates a type guard relationship
interface PreviewImageResult {
  isReady: ComputedRef<boolean>;
  previewImageUrl: ComputedRef<string | null>;
}

// this composable provides a nicer interface for using the
// preview image store. So that we don't need to init polling,
// or register file ids in the components that use it.
export const usePreviewImage = (
  fileIdSource: MaybeRefOrGetter<string | null | undefined>
): PreviewImageResult => {
  const store = usePreviewImageStore();

  store.init();

  // Watch for fileId changes and register new ones
  const isFileIdRegistered = ref(false);

  watch(
    () => toValue(fileIdSource),
    (fileId) => {
      if (!fileId) {
        isFileIdRegistered.value = false;
        return;
      }
      store.registerFileId(fileId);
      isFileIdRegistered.value = true;
    },
    { immediate: true }
  );

  const isReady = computed(() => {
    const fileId = toValue(fileIdSource);
    if (!fileId || !isFileIdRegistered.value) return false;
    return store.isImageReady(fileId);
  });

  const previewImageUrl = computed(() => {
    const fileId = toValue(fileIdSource);
    if (!fileId || !isFileIdRegistered.value) return null;
    return store.getPreviewImageUrl(fileId);
  });

  return {
    isReady,
    previewImageUrl,
  };
};

