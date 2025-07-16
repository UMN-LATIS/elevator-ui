<template>
  <div class="audio-handler-sidecar flex flex-col gap-4">
    <UploadableTextArea
      :modelValue="sidecars.captions ?? ''"
      label="Captions | WebVTT, SRT"
      placeholder="No captions"
      @update:modelValue="
        (value) =>
          $emit('update:sidecars', {
            ...sidecars,
            captions: value,
          })
      " />

    <UploadableTextArea
      :modelValue="sidecars.chapters ?? ''"
      label="Chapters | WebVTT"
      placeholder="No chapters"
      @update:modelValue="
        (value) =>
          $emit('update:sidecars', {
            ...sidecars,
            chapters: value,
          })
      " />
  </div>
</template>

<script setup lang="ts">
import * as Type from "@/types";
import { FileMetaData } from "@/types/FileMetaDataTypes";
import UploadableTextArea from "./UploadableTextArea.vue";

defineProps<{
  sidecars: Type.WithId<Type.UploadWidgetContent["sidecars"]>;
  widgetDef: Type.UploadWidgetDef;
  fileMetaData: FileMetaData | null;
}>();

defineEmits<{
  (
    e: "update:sidecars",
    sidecars: Type.WithId<Type.UploadWidgetContent["sidecars"]>
  ): void;
}>();
</script>
