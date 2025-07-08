<template>
  <EditWidgetLayout
    :widgetContents="uploadedContents"
    :widgetDef="widgetDef"
    class="edit-upload-widget"
    :isOpen="isOpen"
    @update:isOpen="$emit('update:isOpen', $event)"
    @add="
      $emit(
        'update:widgetContents',
        ops.makeAddContentPayload(widgetContents, widgetDef)
      )
    "
    @setPrimary="
      (id) =>
        $emit(
          'update:widgetContents',
          ops.makeSetPrimaryContentPayload(widgetContents, id)
        )
    "
    @delete="
      (id) =>
        $emit(
          'update:widgetContents',
          ops.deleteWidgetContent(widgetContents, id)
        )
    "
    @update:widgetContents="
      (widgetContents) => {
        $emit('update:widgetContents', widgetContents as Type.WithId<Type.UploadWidgetContent>[]);
      }
    ">
    <template #fieldContents="{ item }">
      <div>
        <div class="grid grid-cols-3 gap-4 mb-2">
          <div class="w-full aspect-square rounded-md overflow-hidden relative">
            <img
              :src="`${config.instance.base.url}/fileManager/previewImageByFileId/${item.fileId}/true`"
              :alt="`thumbnail for item: ${item.fileDescription}`"
              class="w-full h-full object-cover" />
          </div>

          <div class="col-span-2 flex flex-col gap-1">
            <label
              :for="`${item.id}-description`"
              class="block text-xs font-medium text-neutral-700 uppercase">
              Description / Alt Text
              <Tooltip
                tip="Used by screen readers to describe the content of the file.">
                <div
                  class="inline-flex size-4 items-center justify-center bg-black/5 text-neutral-800 rounded-full text-xs">
                  ?
                </div>
              </Tooltip>
            </label>
            <textarea
              :id="`${item.id}-description`"
              v-model="item.fileDescription"
              placeholder="Enter a description for this file"
              class="bg-black/5 border-none rounded-md w-full text-sm font-mono flex-1" />
          </div>
        </div>
        <div v-if="isShowingDetails">
          <Tuple label="File ID" class="text-sm text-neutral-600 mb-2">
            {{ item.fileId }}
          </Tuple>
          <Tuple label="File Type" class="text-sm text-neutral-600 mb-2">
            {{ item.fileType }}
          </Tuple>
          <Tuple
            v-for="(value, key) in item.sidecars"
            :key="key"
            :label="`Sidecar: ${key}`"
            class="text-sm text-neutral-600 mb-2">
            {{ value || "-" }}
          </Tuple>
          <Tuple label="Location" class="text-sm text-neutral-600 mb-2">
            <pre>{{ item.loc || "-" }}</pre>
          </Tuple>
          <Tuple label="Search Data" class="text-sm text-neutral-600 mb-2">
            <pre>{{ item.searchData || "-" }}</pre>
          </Tuple>
          <label :for="`${item.id}-input`">JSON</label>
          <textarea
            :id="`${item.id}-input`"
            :value="JSON.stringify(item)"
            :placeholder="widgetDef.label"
            class="bg-black/5 border-none rounded-md w-full text-sm font-mono h-32"
            @input="(event) => handleUpdateContent(item.id, (event.target as HTMLTextAreaElement).value)" />
        </div>
        <button
          class="flex items-center justify-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 w-full p-2"
          @click="isShowingDetails = !isShowingDetails">
          <ChevronDownIcon
            class="w-4 h-4 transition-transform"
            :class="{ 'rotate-180': isShowingDetails }" />
          <span class="sr-only">Toggle Details</span>
        </button>
      </div>
    </template>
    <template #footer>
      <FileUploader :collectionId="props.collectionId" />
    </template>
  </EditWidgetLayout>
</template>
<script setup lang="ts">
import { computed, ref } from "vue";
import * as Type from "@/types";
import EditWidgetLayout from "./EditWidgetLayout.vue";
import * as ops from "../editWidgetOps";
import invariant from "tiny-invariant";
import FileUploader from "./FileUploader.vue";
import config from "@/config";
import Tooltip from "@/components/Tooltip/Tooltip.vue";
import { ChevronDownIcon } from "lucide-vue-next";
import Tuple from "@/components/Tuple/Tuple.vue";

const props = defineProps<{
  collectionId: number;
  widgetDef: Type.UploadWidgetProps;
  widgetContents: Type.WithId<Type.UploadWidgetContent>[];
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (
    e: "update:widgetContents",
    widgetContents: Type.WithId<Type.UploadWidgetContent>[]
  );
  (e: "update:isOpen", isOpen: boolean): void;
}>();

const isShowingDetails = ref(false);

const uploadedContents = computed(() => {
  return props.widgetContents.filter(
    (content) => content.fileId && content.fileId !== ""
  );
});

function handleUpdateContent(id: string, value: string) {
  const parsedValue = JSON.parse(
    value
  ) as Type.WithId<Type.UploadWidgetContent>;
  invariant(
    parsedValue,
    `Parsed value is not a valid UploadWidgetContent: ${value}`
  );

  const index = props.widgetContents.findIndex((content) => content.id === id);
  invariant(
    index !== -1,
    `Widget content with id ${id} not found in widget contents`
  );
  const updatedContents = [
    ...props.widgetContents.slice(0, index),
    parsedValue,
    ...props.widgetContents.slice(index + 1),
  ];

  emit("update:widgetContents", updatedContents);
}

// listen for Command + Control + H to show/hide details
document.addEventListener("keydown", (event) => {
  if (event.key === "h" && event.ctrlKey && event.metaKey) {
    event.preventDefault();
    isShowingDetails.value = !isShowingDetails.value;
  }
});
</script>
<style scoped></style>
<style></style>
