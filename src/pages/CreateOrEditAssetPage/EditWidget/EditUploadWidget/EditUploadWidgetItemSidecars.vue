<template>
  <div class="upload-widget-item-sidecars">
    <!-- <h3 class="text-sm font-semibold text-neutral-800 mb-2">Sidecars</h3>
    <p class="text-sm text-neutral-600 mb-2">
      Sidecars are additional metadata or files associated with the main file.
    </p> -->
    <component
      :is="sidecarComponent"
      v-if="sidecarComponent"
      :sidecars="item.sidecars"
      :widgetDef="widgetDef"
      :fileMetaData="fileMetadata"
      @update:sidecars="$emit('update:item', { ...item, sidecars: $event })" />
  </div>
</template>
<script setup lang="ts">
import * as Type from "@/types";
import { useFileMetadataQuery } from "@/queries/useFileMetadataQuery";
import { PartialRecord } from "ramda";
import { type Component, computed } from "vue";
import ImageHandlerSidecar from "./Sidecars/ImageHandlerSidecar.vue";
import AudioHandlerSidecar from "./Sidecars/AudioHandlerSidecar.vue";
import MovieHandlerSidecar from "./Sidecars/MovieHandlerSidecar.vue";
import ObjHandlerSidecar from "./Sidecars/ObjHandlerSidecar.vue";
import PlyHandlerSidecar from "./Sidecars/PlyHandlerSidecar.vue";
import ZipObjHandlerSidecar from "./Sidecars/ZipObjHandlerSidecar.vue";

const props = defineProps<{
  item: Type.WithId<Type.UploadWidgetContent>;
  widgetDef: Type.UploadWidgetDef;
}>();

defineEmits<{
  (e: "update:item", item: Type.WithId<Type.UploadWidgetContent>): void;
}>();

const { data: fileMetadata } = useFileMetadataQuery(() => props.item.fileId);

const fileHandlerName = computed(
  () => fileMetadata?.value?.handlerType?.toLowerCase() ?? null
);

type IsEnabledFn = ({
  item,
  widgetDef,
}: {
  item: Type.WithId<Type.UploadWidgetContent>;
  widgetDef: Type.UploadWidgetDef;
}) => boolean;

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

// const sidecarRegistry: PartialRecord<FileHandlerType, Sidecar[]> = {
//   imagehandler: [
//     {
//       name: "ppm",
//       label: "Pixels per Millimeter",
//       component: "input",
//       placeholder: "Optional value",
//       isEnabled: () => true,
//     },
//     {
//       name: "iframe",
//       label: "iframe url",
//       component: "input",
//       placeholder: "HTTPS highly recommended",
//       isEnabled: ({ widgetDef }) => widgetDef.fieldData.enableIframe ?? false,
//     },
//     {
//       name: "dendro",
//       label: "Dendro Data",
//       component: "input",
//       placeholder: "",
//       isEnabled: ({ widgetDef }) => widgetDef.fieldData.enableDendro ?? false,
//     },
//     {
//       name: "svs",
//       label: "SVS Data",
//       component: "input",
//       placeholder: "",
//       isEnabled: ({ item, widgetDef }) => !!item.sidecars?.svs,
//     },
//   ],
// };
</script>
<style scoped></style>
