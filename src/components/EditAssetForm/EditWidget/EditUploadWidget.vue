<template>
  <EditWidgetLayout
    :widgetContents="widgetContents"
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
      <ThumbnailImage
        v-if="item.fileId"
        :src="`${config.instance.base.url}/fileManager/tinyImageByFileId/${item.fileId}/true`"
        :alt="item.fileDescription"
        :fileType="item.fileType"
        :showHoverIcon="false"
        class="thumbnail-related-asset-widget__image max-w-full" />
      <FileUploader
        v-else
        :widgetContent="item"
        :widgetDef="widgetDef"
        :collectionId="collectionId" />
      <div>
        <label :for="`${item.id}-input`" class="sr-only">
          {{ widgetDef.label }}
        </label>
        <textarea
          :id="`${item.id}-input`"
          :value="JSON.stringify(item)"
          :placeholder="widgetDef.label"
          class="bg-black/5 border-none rounded-md w-full text-sm font-mono h-32"
          @input="(event) => handleUpdateContent(item.id, (event.target as HTMLTextAreaElement).value)" />
      </div>
    </template>
  </EditWidgetLayout>
</template>
<script setup lang="ts">
import * as Type from "@/types";
import EditWidgetLayout from "./EditWidgetLayout.vue";
import * as ops from "../editWidgetOps";
import invariant from "tiny-invariant";
import FileUploader from "./FileUploader.vue";
import config from "@/config";
import ThumbnailImage from "@/components/ThumbnailImage/ThumbnailImage.vue";

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
</script>
<style scoped></style>
<style></style>
