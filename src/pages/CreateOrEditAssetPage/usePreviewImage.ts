import * as Type from "@/types";
import { computed, reactive } from "vue";
import config from "@/config";

export const usePreviewImages = () => {
  const isPreviewImageReadyMap = reactive<
    Map<Type.UploadWidgetContent["fileId"], boolean>
  >(new Map());

  const fileIdsToCheck = reactive<Set<Type.UploadWidgetContent["fileId"]>>(
    new Set()
  );

  function getPreviewImage(fileId: Type.UploadWidgetContent["fileId"]) {
    // if the image is ready, return it
    const isReady = computed(() => isPreviewImageReadyMap.get(fileId));
    const url = computed(
      () =>
        `${config.instance.base.url}/fileManager/previewImageByFileId/${fileId}/true?isReady=${isReady.value}`
    );

    return url;
  }
};
