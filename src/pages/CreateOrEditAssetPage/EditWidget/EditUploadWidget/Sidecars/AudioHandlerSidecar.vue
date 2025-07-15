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
    <!-- <section class="border border-black/20 rounded-md p-4 flex flex-col gap-4">
      <h3 class="text-sm font-bold">Captions</h3>
      <TextAreaGroup
        :modelValue="sidecars.captions ?? ''"
        label="Captions (WebVTT or SRT format)"
        placeholder="No captions"
        inputClass="bg-black/5 border-0"
        @update:modelValue="
          (value) =>
            $emit('update:sidecars', {
              ...sidecars,
              captions: value as string,
            })" />
      <FileReaderInputGroup
        label="Import"
        @update="
          ({ fileContents }) =>
            $emit('update:sidecars', {
              ...sidecars,
              captions: fileContents,
            })
        " />
    </section> -->

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
import FileReaderInputGroup from "@/components/FileReaderInputGroup/FileReaderInputGroup.vue";
import InputGroup from "@/components/InputGroup/InputGroup.vue";
import TextAreaGroup from "@/components/TextAreaGroup/TextAreaGroup.vue";
import * as Type from "@/types";
import { FileMetaData } from "@/types/FileMetaDataTypes";
import { ref, watch } from "vue";
import UploadableTextArea from "./UploadableTextArea.vue";

const props = defineProps<{
  sidecars: Type.WithId<Type.UploadWidgetContent["sidecars"]>;
  widgetDef: Type.UploadWidgetDef;
  fileMetaData: FileMetaData | null;
}>();

// track initial sidecars so that the textares don't disappear
// if the user clears all content
const initialSidecars = ref(props.sidecars);

const emit = defineEmits<{
  (
    e: "update:sidecars",
    item: Type.WithId<Type.UploadWidgetContent["sidecars"]>
  ): void;
}>();
</script>
