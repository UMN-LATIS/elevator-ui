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
      <EditInlineRelatedAssetWidgetContentItem
        v-if="widgetDef.fieldData.displayInline"
        :collectionId="collectionId"
        :widgetDef="widgetDef"
        :assetId="assetId"
        :modelValue="(item as Type.WithId<Type.RelatedAssetWidgetContent>)"
        @update:modelValue="handleUpdate" />
      <EditRelatedAssetWidgetContentItem
        v-else
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
import EditWidgetLayout from "../EditWidgetLayout.vue";
import EditRelatedAssetWidgetContentItem from "./EditRelatedAssetContentItem.vue";
import EditInlineRelatedAssetWidgetContentItem from "./EditRelatedAssetInlineContentItem.vue";
import * as ops from "../helpers/editWidgetOps";

const props = defineProps<{
  collectionId: Type.AssetCollection["id"];
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
  const updatedContents = props.widgetContents.map((item) =>
    item.id === updatedItem.id ? updatedItem : item
  );

  emit("update:widgetContents", updatedContents);
};
</script>
<style scoped></style>
<style></style>
