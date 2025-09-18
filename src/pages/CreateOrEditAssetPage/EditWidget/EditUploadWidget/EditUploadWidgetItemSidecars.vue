<template>
  <div class="upload-widget-item-sidecars">
    <component
      :is="sidecarComponent"
      v-if="sidecarComponent"
      :sidecars="item.sidecars"
      :widgetDef="widgetDef"
      :fileMetaData="fileMetaData"
      @update:sidecars="$emit('update:item', { ...item, sidecars: $event })" />
  </div>
</template>
<script setup lang="ts">
import * as Type from "@/types";
import { PartialRecord } from "ramda";
import { type Component, computed } from "vue";
import ImageHandlerSidecar from "./Sidecars/ImageHandlerSidecar.vue";
import AudioHandlerSidecar from "./Sidecars/AudioHandlerSidecar.vue";
import MovieHandlerSidecar from "./Sidecars/MovieHandlerSidecar.vue";
import ObjHandlerSidecar from "./Sidecars/ObjHandlerSidecar.vue";
import PlyHandlerSidecar from "./Sidecars/PlyHandlerSidecar.vue";
import ZipObjHandlerSidecar from "./Sidecars/ZipObjHandlerSidecar.vue";
import { FileMetaData } from "@/types/FileMetaDataTypes";

const props = defineProps<{
  item: Type.WithId<Type.UploadWidgetContent>;
  widgetDef: Type.UploadWidgetDef;
  fileMetaData?: FileMetaData;
}>();

defineEmits<{
  (e: "update:item", item: Type.WithId<Type.UploadWidgetContent>): void;
}>();

const fileHandlerName = computed(
  () => props.fileMetaData?.handlerType?.toLowerCase() ?? null
);

type FileHandlerType =
  | "audiohandler"
  | "imagehandler"
  | "moviehandler"
  | "objhandler"
  | "plyhandler"
  | "zipobjhandler";
const sidecarComponents: PartialRecord<FileHandlerType, Component> = {
  imagehandler: ImageHandlerSidecar,
  audiohandler: AudioHandlerSidecar,
  moviehandler: MovieHandlerSidecar,
  objhandler: ObjHandlerSidecar,
  plyhandler: PlyHandlerSidecar,
  zipobjhandler: ZipObjHandlerSidecar,
};

const sidecarComponent = computed(() => {
  if (!fileHandlerName.value) {
    return null;
  }
  const component = sidecarComponents[fileHandlerName.value];
  if (!component) {
    console.warn(
      `No sidecar component found for handler type: ${fileHandlerName.value}`
    );
    return null;
  }
  return component;
});
</script>
<style scoped></style>
