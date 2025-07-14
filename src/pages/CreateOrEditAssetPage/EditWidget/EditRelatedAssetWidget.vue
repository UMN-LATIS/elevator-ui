<template>
  <EditWidgetLayout
    :widgetContents="widgetContents"
    :widgetDef="widgetDef"
    class="edit-relatedasset-widget"
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
        $emit('update:widgetContents', widgetContents as Type.WithId<Type.RelatedAssetWidgetContent>[]);
      }
    ">
    <template #fieldContents="{ item }">
      <EditRelatedAssetWidgetContentItem
        :widgetDef="widgetDef"
        :widgetContents="widgetContents"
        :assetId="assetId"
        :modelValue="(item as Type.WithId<Type.RelatedAssetWidgetContent>)"
        @update:modelValue="handleUpdate" />
    </template>
  </EditWidgetLayout>
</template>
<script setup lang="ts">
import * as Type from "@/types";
import EditWidgetLayout from "./EditWidgetLayout.vue";
import EditRelatedAssetWidgetContentItem from "./EditRelatedAssetWidgetContentItem.vue";
import * as ops from "./helpers/editWidgetOps";
import invariant from "tiny-invariant";

const props = defineProps<{
  widgetDef: Type.RelatedAssetWidgetDef;
  widgetContents: Type.WithId<Type.RelatedAssetWidgetContent>[];
  assetId: string | null; // current assetId. could be null for new assets
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (
    e: "update:widgetContents",
    widgetContents: Type.WithId<Type.RelatedAssetWidgetContent>[]
  ): void;
  (e: "update:isOpen", isOpen: boolean): void;
}>();

const handleUpdate = (updatedItem) => {
  const index = props.widgetContents.findIndex(
    (item) => item.id === updatedItem.id
  );

  invariant(
    index !== -1,
    `Item with id ${updatedItem.id} not found in widgetContents`
  );

  const updatedContents = [
    ...props.widgetContents.slice(0, index),
    updatedItem,
    ...props.widgetContents.slice(index + 1),
  ];

  emit("update:widgetContents", updatedContents);
};
</script>
<style scoped></style>
<style></style>
