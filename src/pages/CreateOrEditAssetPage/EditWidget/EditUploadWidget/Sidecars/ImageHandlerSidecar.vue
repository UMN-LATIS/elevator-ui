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

    <section
      v-if="sidecars.dendro || initialSidecars.dendro"
      class="border border-black/20 rounded-md p-4 flex flex-col gap-4">
      <h3 class="text-sm font-bold">Dendro Data</h3>
      <TextAreaGroup
        v-model="localDendro"
        label="Dendro Data"
        placeholder="No dendro data"
        inputClass="bg-black/5 border-0" />
      <FileReaderInputGroup
        label="Import"
        @update="
          ({ fileContents }) =>
            $emit('update:sidecars', {
              ...sidecars,
              dendro: fileContents,
            })
        " />
    </section>

    <section
      v-if="sidecars.svs || initialSidecars.svs"
      class="border border-black/20 rounded-md p-4 flex flex-col gap-4">
      <h3 class="text-sm font-bold">SVS Data</h3>
      <TextAreaGroup
        v-model="localSvs"
        label="SVS Data"
        placeholder="No SVS data"
        inputClass="bg-black/5 border-0" />
      <FileReaderInputGroup
        label="Import"
        @update="
          ({ fileContents }) =>
            $emit('update:sidecars', {
              ...sidecars,
              svs: fileContents,
            })
        " />
    </section>
  </div>
</template>

<script setup lang="ts">
import FileReaderInputGroup from "@/components/FileReaderInputGroup/FileReaderInputGroup.vue";
import InputGroup from "@/components/InputGroup/InputGroup.vue";
import TextAreaGroup from "@/components/TextAreaGroup/TextAreaGroup.vue";
import * as Type from "@/types";
import { FileMetaData } from "@/types/FileMetaDataTypes";
import { ref, watch } from "vue";

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
