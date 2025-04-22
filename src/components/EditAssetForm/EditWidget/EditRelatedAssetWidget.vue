<template>
  <EditWidgetLayout
    :widgetContents="widgetContents"
    :widgetDef="widgetDef"
    class="edit-relatedasset-widget"
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
        $emit('update:widgetContents', widgetContents);
      }
    ">
    <template #fieldContents="{ item }">
      <EditRelatedAssetWidgetContentItem
        :widgetDef="widgetDef"
        :modelValue="item"
        @update:modelValue="handleUpdate" />
    </template>
  </EditWidgetLayout>
</template>
<script setup lang="ts">
import * as Type from "@/types";
import EditWidgetLayout from "./EditWidgetLayout.vue";
import EditRelatedAssetWidgetContentItem from "./EditRelatedAssetWidgetContentItem.vue";
import * as ops from "../editWidgetOps";

const props = defineProps<{
  widgetDef: Type.RelatedAssetWidgetProps;
  widgetContents: Type.WithId<Type.RelatedAssetWidgetContent>[];
}>();

const emit = defineEmits<{
  (
    e: "update:widgetContents",
    widgetContents: Type.WithId<Type.RelatedAssetWidgetContent>[]
  ): void;
}>();

const handleUpdate = (updatedItem) => {
  const index = props.widgetContents.findIndex(
    (item) => item.id === updatedItem.id
  );
  emit("update:widgetContents", [
    ...props.widgetContents.slice(0, index),
    updatedItem,
    ...props.widgetContents.slice(index + 1),
  ]);
};
</script>
<style scoped></style>
<style></style>
