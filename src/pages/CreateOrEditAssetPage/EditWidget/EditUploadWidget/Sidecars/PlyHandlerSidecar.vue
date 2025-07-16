<template>
  <div class="ply-handler-sidecar">
    <UploadableTextArea
      :modelValue="sidecars['3dpoints'] ?? ''"
      label="3D Points"
      placeholder="No 3D points"
      @update:modelValue="
        (value) =>
          $emit('update:sidecars', {
            ...sidecars,
            ['3dpoints']: value,
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
<style scoped></style>
