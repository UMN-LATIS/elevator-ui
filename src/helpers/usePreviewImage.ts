import { usePreviewImageStore } from "@/stores/previewImageStore";
import invariant from "tiny-invariant";
import {
  computed,
  watch,
  onBeforeUnmount,
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

  // watch (not watchEffect) so we only track fileId — watchEffect would
  // also track reactive reads inside registerFileId, causing an infinite
  // loop when those same maps are mutated.
  watch(
    fileId,
    (newId, oldId) => {
      if (oldId) store.unregisterFileId(oldId);
      if (newId) store.registerFileId(newId);
    },
    { immediate: true },
  );

  onBeforeUnmount(() => {
    if (fileId.value) store.unregisterFileId(fileId.value);
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
