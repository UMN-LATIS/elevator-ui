<template>
  <div class="upload-widget-item-sidecars">
    <h3 class="text-sm font-semibold text-neutral-800 mb-2">Sidecars</h3>
    <p class="text-sm text-neutral-600 mb-2">
      Sidecars are additional metadata or files associated with the main file.
    </p>
    <Tuple label="Item">
      <pre>{{ JSON.stringify(item, null, 2) }}</pre>
    </Tuple>
    <Tuple label="Widget Definition">
      <pre>{{ JSON.stringify(widgetDef, null, 2) }}</pre>
    </Tuple>
    <Tuple label="Metadata">
      <pre>
      {{ fileMetadata ? JSON.stringify(fileMetadata, null, 2) : "Loading..." }}
    </pre
      >
    </Tuple>
  </div>
</template>
<script setup lang="ts">
import * as Type from "@/types";
import { useFileMetadataQuery } from "@/queries/useFileMetadataQuery";
import Tuple from "@/components/Tuple/Tuple.vue";
import { PartialRecord } from "ramda";
import { computed } from "vue";

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

interface Sidecar {
  name: string;
  label: string;
  component: "input";
  placeholder?: string;
  isEnabled: IsEnabledFn;
}

type FileHandlerType =
  | "audiohandler"
  | "imagehandler"
  | "moviehandler"
  | "objhandler"
  | "plyhandler"
  | "zipobjhandler";

const sidecarRegistry: PartialRecord<FileHandlerType, Sidecar[]> = {
  imagehandler: [
    {
      name: "ppm",
      label: "Pixels per Millimeter",
      component: "input",
      placeholder: "Optional value",
      isEnabled: () => true,
    },
    {
      name: "iframe",
      label: "iframe url",
      component: "input",
      placeholder: "HTTPS highly recommended",
      isEnabled: ({ widgetDef }) => widgetDef.fieldData.enableIframe ?? false,
    },
    {
      name: "dendro",
      label: "Dendro Data",
      component: "input",
      placeholder: "",
      isEnabled: ({ widgetDef }) => widgetDef.fieldData.enableDendro ?? false,
    },
    {
      name: "svs",
      label: "SVS Data",
      component: "input",
      placeholder: "",
      isEnabled: ({ item, widgetDef }) => !!item.sidecars?.svs,
    },
  ],
};
</script>
<style scoped></style>
