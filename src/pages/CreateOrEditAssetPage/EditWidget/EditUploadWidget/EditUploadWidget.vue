<template>
  <EditWidgetLayout
    :widgetContents="widgetContents"
    :widgetDef="widgetDef"
    class="edit-upload-widget"
    :isOpen="isOpen"
    @update:isOpen="$emit('update:isOpen', $event)"
    @setPrimary="
      (id) =>
        $emit(
          'update:widgetContents',
          ops.makeSetPrimaryContentPayload(widgetContents, id)
        )
    "
    @delete="
      (id) => {
        handleDeleteContent(id);
      }
    "
    @update:widgetContents="
      (widgetContents) => {
        $emit('update:widgetContents', widgetContents as Type.WithId<Type.UploadWidgetContent>[]);
      }
    ">
    <template #fieldContents="{ item }">
      <EditUploadWidgetItem
        :item="item"
        :widgetDef="widgetDef"
        :isShowingDetails="isShowingDetails.has(item.id)"
        :class="[
          'upload-widget-item',
          {
            'upload-widget-item--is-uploading': !item.loc,
          },
        ]"
        @update:item="handleUpdateItem"
        @toggle:details="
          isShowingDetails.has(item.id)
            ? isShowingDetails.delete(item.id)
            : isShowingDetails.add(item.id)
        " />
    </template>
    <template #footer>
      <FileUploader
        v-show="widgetDef.allowMultiple || !hasContents"
        :collectionId="props.collectionId"
        :maxNumberOfFiles="widgetDef.allowMultiple ? undefined : 1"
        @complete="handleCompleteUpload" />
    </template>
  </EditWidgetLayout>
</template>
<script setup lang="ts">
import { computed, nextTick, ref } from "vue";
import * as Type from "@/types";
import EditWidgetLayout from "../EditWidgetLayout.vue";
import * as ops from "../helpers/editWidgetOps";
import FileUploader from "./FileUploader.vue";
import { createDefaultWidgetContent } from "@/helpers/createDefaultWidgetContents";
import api from "@/api";
import EditUploadWidgetItem from "./EditUploadWidgetItem.vue";
import { useDebounceFn } from "@vueuse/core";
import invariant from "tiny-invariant";

const props = defineProps<{
  collectionId: number;
  widgetDef: Type.UploadWidgetDef;
  widgetContents: Type.WithId<Type.UploadWidgetContent>[];
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (
    e: "update:widgetContents",
    widgetContents: Type.WithId<Type.UploadWidgetContent>[]
  );
  (e: "update:isOpen", isOpen: boolean): void;
  (e: "save"): void;
}>();

const isShowingDetails = ref<Set<string>>(new Set());
const hasContents = computed(() => {
  return props.widgetContents.length > 0;
});

const debouncedEmitSave = useDebounceFn(() => emit("save"), 1000, {
  maxWait: 5000,
});

async function handleCompleteUpload(fileRecord: Type.FileUploadRecord) {
  invariant(
    fileRecord.location,
    `fileRecord must have a location after upload`
  );

  const uploadedItem: Type.WithId<Type.UploadWidgetContent> = {
    ...createDefaultWidgetContent(props.widgetDef),
    fileId: fileRecord.fileObjectId,
    fileDescription: "",
    fileType: fileRecord.contentType,
    loc: fileRecord.location || "", // Use the location from the file record
    sidecars: {}, // Initialize sidecars as an empty object
    searchData: "", // Initialize searchData as an empty string
  };

  emit("update:widgetContents", [
    ...props.widgetContents,
    uploadedItem,
  ] as Type.WithId<Type.UploadWidgetContent>[]);

  await nextTick();
  debouncedEmitSave();
}

async function handleDeleteContent(id: string) {
  if (
    !confirm(
      "Delete this upload object? This action cannot be undone and will delete the source media and any derivatives."
    )
  ) {
    return;
  }

  const item = props.widgetContents.find((item) => item.id === id);

  if (!item) {
    throw new Error(
      `No upload item found with id: ${id}. Cannot delete non-existent item.`
    );
  }

  // Call the API to delete the file object
  await api.deleteFileObject(item.fileId);

  emit(
    "update:widgetContents",
    ops.deleteWidgetContent(props.widgetContents, id)
  );

  await nextTick();
  debouncedEmitSave();
}

function handleUpdateItem(item: Type.WithId<Type.UploadWidgetContent>) {
  const updatedContents = props.widgetContents.map((existingItem) => {
    if (existingItem.id === item.id) {
      return { ...existingItem, ...item };
    }
    return existingItem;
  });
  emit("update:widgetContents", updatedContents);
}
</script>
<style>
/**
 * hide widget items until upload completes
 */
.drag-drop-list-item:has(.upload-widget-item.upload-widget-item--is-uploading) {
  @apply hidden;
}
</style>
<style></style>
