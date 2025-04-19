<template>
  <EditWidgetLayout
    :widgetContents="widgetContents"
    :widgetDef="widgetDef"
    class="edit-date-widget"
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
      <EditDateWidgetContentItem
        :modelValue="item"
        @update:modelValue="handleItemUpdate" />
    </template>
  </EditWidgetLayout>
</template>
<script setup lang="ts">
import * as Type from "@/types";
import EditWidgetLayout from "./EditWidgetLayout.vue";
import * as ops from "../editWidgetOps";
import EditDateWidgetContentItem from "./EditDateWidgetContentItem.vue";

const props = defineProps<{
  widgetDef: Type.DateWidgetProps;
  widgetContents: Type.WithId<Type.DateWidgetContent>[];
}>();

const emit = defineEmits<{
  (
    e: "update:widgetContents",
    widgetContents: Type.WithId<Type.DateWidgetContent>[]
  ): void;
}>();

function handleItemUpdate(updatedItem: Type.WithId<Type.DateWidgetContent>) {
  const index = props.widgetContents.findIndex((i) => i.id === updatedItem.id);
  if (index === -1) {
    throw Error(
      `Cannot update date widget: item with id "${updatedItem.id}" not found`
    );
  }

  const updatedWidgetContents = [
    ...props.widgetContents.slice(0, index),
    updatedItem,
    ...props.widgetContents.slice(index + 1),
  ];
  emit("update:widgetContents", updatedWidgetContents);
}
</script>
<style scoped></style>
<style></style>
