import { usePreviewImageStore } from "@/stores/previewImageStore";
import invariant from "tiny-invariant";
import {
  computed,
  watch,
  toValue,
  type MaybeRefOrGetter,
  type ComputedRef,
} from "vue";

interface PreviewImageResult {
  isReady: ComputedRef<boolean>;
  previewImageUrl: ComputedRef<string | null>;
}

export const usePreviewImage = (
  fileIdSource: MaybeRefOrGetter<string | null | undefined>
): PreviewImageResult => {
  const store = usePreviewImageStore();
  const fileId = computed(() => toValue(fileIdSource));

  watch(
    fileId,
    () => {
      if (!fileId.value) return;
      store.registerFileId(fileId.value);
    },
    { immediate: true }
  );

  const isReady = computed((): boolean => {
    return Boolean(fileId.value && store.isImageReady(fileId.value));
  });

  const previewImageUrl = computed(() => {
    invariant(
      fileId.value,
      "File ID must be defined to get preview image URL."
    );

    return store.getPreviewImageUrl(fileId.value);
  });

  return {
    isReady,
    previewImageUrl,
  };
};
