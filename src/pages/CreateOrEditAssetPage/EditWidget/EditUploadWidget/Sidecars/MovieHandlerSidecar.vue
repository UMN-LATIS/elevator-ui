<template>
  <div class="movie-handler-sidecar flex flex-col gap-4">
    <div class="flex flex-col gap-1">
      <label
        :for="languageId"
        class="text-xs uppercase font-medium text-on-surface">
        Language
      </label>
      <select
        :id="languageId"
        :value="sidecars.language ?? ''"
        class="rounded-md border-outline-variant bg-surface-container text-sm focus-visible:ring-2"
        @change="
          $emit('update:sidecars', {
            ...sidecars,
            language: ($event.target as HTMLSelectElement).value || null,
          })
        ">
        <option value="">Auto-detect language</option>
        <option
          v-for="opt in iso639LanguageOptions"
          :key="opt.id"
          :value="opt.id">
          {{ opt.label }}
        </option>
      </select>
    </div>

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
import { iso639LanguageOptions } from "@/constants/iso639";
import * as Type from "@/types";
import { FileMetaData } from "@/types/FileMetaDataTypes";
import UploadableTextArea from "./UploadableTextArea.vue";

const languageId = `language-${crypto.randomUUID()}`;

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
