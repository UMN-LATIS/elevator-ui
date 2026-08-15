<template>
  <EditWidgetLayout
    :widgetContents="widgetContents"
    :widgetDef="widgetDef"
    class="edit-date-widget"
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
        $emit('update:widgetContents', widgetContents as Type.WithUuid<Type.DateWidgetContent>[]);
      }
    ">
    <template #fieldContents="{ item }">
      <EditDateWidgetContentItem
        :modelValue="(item as Type.WithUuid<Type.DateWidgetContent>)"
        :widgetDef="widgetDef"
        @update:modelValue="handleItemUpdate" />
    </template>
  </EditWidgetLayout>
</template>
<script setup lang="ts">
import * as Type from "@/types";
import EditWidgetLayout from "./EditWidgetLayout.vue";
import * as ops from "./helpers/editWidgetOps";
import EditDateWidgetContentItem from "./EditDateWidgetContentItem.vue";

const props = defineProps<{
  widgetDef: Type.DateWidgetDef;
  widgetContents: Type.WithUuid<Type.DateWidgetContent>[];
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (
    e: "update:widgetContents",
    widgetContents: Type.WithUuid<Type.DateWidgetContent>[]
  ): void;
  (e: "update:isOpen", isOpen: boolean): void;
}>();

function handleItemUpdate(updatedItem: Type.WithUuid<Type.DateWidgetContent>) {
  const index = props.widgetContents.findIndex(
    (content) => content.uuid === updatedItem.uuid
  );
  if (index === -1) {
    throw Error(
      `Cannot update date widget: item with id "${updatedItem.uuid}" not found`
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
