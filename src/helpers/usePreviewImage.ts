import { usePreviewImageStore } from "@/stores/previewImageStore";
import invariant from "tiny-invariant";
import {
  computed,
  watchEffect,
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

  watchEffect((onCleanup) => {
    const id = fileId.value;
    if (!id) return;
    store.registerFileId(id);
    onCleanup(() => store.unregisterFileId(id));
  });

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
