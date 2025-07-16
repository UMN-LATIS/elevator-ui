<template>
  <div class="obj-handler-sidecar">
    <UploadableTextArea
      v-if="instanceStore.instance.useVoyagerViewer"
      v-model="localSVX"
      label="SVX File"
      placeholder="No SVX data" />
    <uploadable-text-area
      v-else
      v-model="local3dPoints"
      label="3D Points Data"
      placeholder="No 3D points data" />
  </div>
</template>
<script setup lang="ts">
import { useInstanceStore } from "@/stores/instanceStore";
import * as Type from "@/types";
import { FileMetaData } from "@/types/FileMetaDataTypes";
import UploadableTextArea from "./UploadableTextArea.vue";
import { ref, watch } from "vue";

const instanceStore = useInstanceStore();
const props = defineProps<{
  sidecars: Type.WithId<Type.UploadWidgetContent["sidecars"]>;
  widgetDef: Type.UploadWidgetDef;
  fileMetaData: FileMetaData | null;
}>();

const emit = defineEmits<{
  (
    e: "update:sidecars",
    sidecars: Type.WithId<Type.UploadWidgetContent["sidecars"]>
  ): void;
}>();

// Simple function to convert objects to strings for display
function toDisplayString(
  value: string | Record<string, unknown> | null = null
): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  return JSON.stringify(value, null, 2);
}

const localSVX = ref(toDisplayString(props.sidecars.svx));
const local3dPoints = ref(toDisplayString(props.sidecars["3dpoints"]));

watch(localSVX, (value) => {
  emit("update:sidecars", {
    ...props.sidecars,
    svx: value,
  });
});

watch(local3dPoints, (value) => {
  emit("update:sidecars", {
    ...props.sidecars,
    "3dpoints": value,
  });
});

// Update local values when props change
watch(
  () => props.sidecars,
  (newSidecars) => {
    localSVX.value = toDisplayString(newSidecars.svx);
    local3dPoints.value = toDisplayString(newSidecars["3dpoints"]);
  }
);
</script>
<style scoped></style>
