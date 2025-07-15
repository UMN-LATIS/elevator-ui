<template>
  <div class="audio-handler-sidecar flex flex-col gap-4">
    <UploadableTextArea
      :modelValue="sidecars.captions ?? ''"
      label="Captions (WebVTT or SRT format)"
      placeholder="No captions"
      @update:modelValue="
        (value) =>
          $emit('update:sidecars', {
            ...sidecars,
            captions: value,
          })
      " />

    <TextAreaGroup
      label="Chapter Markers"
      :modelValue="sidecars.chapters ?? ''"
      placeholder="No chapter markers"
      inputClass="bg-black/5 border-0"
      @update:modelValue="
        (value) =>
          $emit('update:sidecars', {
            ...sidecars,
            chapters: value as string,
          })
      " />
  </div>
</template>

<script setup lang="ts">
import TextAreaGroup from "@/components/TextAreaGroup/TextAreaGroup.vue";
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
