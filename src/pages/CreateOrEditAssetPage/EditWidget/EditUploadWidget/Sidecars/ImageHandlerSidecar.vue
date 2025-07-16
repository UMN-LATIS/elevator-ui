<template>
  <div class="image-handler-sidecar flex flex-col gap-4">
    <InputGroup
      label="Pixels Per Millimeter"
      :modelValue="sidecars.ppm ?? ''"
      placeholder="Optional value"
      type="number"
      @update:modelValue="
        (value) =>
          $emit('update:sidecars', {
            ...sidecars,
            ppm: Number.parseInt(String(value)) ?? null,
          })
      " />
    <InputGroup
      v-if="widgetDef.fieldData.enableIframe"
      label="Iframe URL"
      :modelValue="sidecars.iframe ?? ''"
      placeholder="HTTPS highly recommended"
      type="text"
      @update:modelValue="
        (value) =>
          $emit('update:sidecars', {
            ...sidecars,
            iframe: value as string,
          })
      " />

    <UploadableTextArea
      v-if="sidecars.dendro || initialSidecars.dendro"
      v-model="localDendro"
      label="Dendro Data"
      placeholder="No dendro data" />

    <UploadableTextArea
      v-if="sidecars.svs || initialSidecars.svs"
      v-model="localSvs"
      label="SVS Data"
      placeholder="No SVS data" />
  </div>
</template>

<script setup lang="ts">
import InputGroup from "@/components/InputGroup/InputGroup.vue";
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

// Simple function to convert objects to strings for display
function toDisplayString(
  value: string | Record<string, unknown> | null = null
): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  return JSON.stringify(value, null, 2);
}

const localDendro = ref(toDisplayString(props.sidecars.dendro));
const localSvs = ref(toDisplayString(props.sidecars.svs));

// Emit changes directly without validation
watch(localDendro, (value) => {
  emit("update:sidecars", {
    ...props.sidecars,
    dendro: value,
  });
});

watch(localSvs, (value) => {
  emit("update:sidecars", {
    ...props.sidecars,
    svs: value,
  });
});

// Update local values when props change
watch(
  () => props.sidecars,
  (newSidecars) => {
    localDendro.value = toDisplayString(newSidecars.dendro);
    localSvs.value = toDisplayString(newSidecars.svs);
  }
);
</script>
