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
        $emit('update:widgetContents', widgetContents as Type.WithUuid<Type.LocationWidgetContent>[]);
      }
    ">
    <template #fieldContents="{ item }">
      <EditLocationWidgetContentItem
        :modelValue="(item as Type.WithUuid<Type.LocationWidgetContent>)"
        :widgetDef="widgetDef"
        @update:modelValue="handleItemUpdate" />
    </template>
  </EditWidgetLayout>
</template>
<script setup lang="ts">
import * as Type from "@/types";
import EditWidgetLayout from "./EditWidgetLayout.vue";
import * as ops from "./helpers/editWidgetOps";
import EditLocationWidgetContentItem from "./EditLocationWidgetContentItem.vue";

const props = defineProps<{
  widgetDef: Type.LocationWidgetDef;
  widgetContents: Type.WithUuid<Type.LocationWidgetContent>[];
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (
    e: "update:widgetContents",
    widgetContents: Type.WithUuid<Type.LocationWidgetContent>[]
  ): void;
  (e: "update:isOpen", isOpen: boolean): void;
}>();

function handleItemUpdate(
  updatedItem: Type.WithUuid<Type.LocationWidgetContent>
) {
  const index = props.widgetContents.findIndex(
    (content) => content.uuid === updatedItem.uuid
  );
  if (index === -1) {
    throw Error(
      `Cannot update location widget: item with uuid "${updatedItem.uuid}" not found`
    );
  }

  const updatedContents = [
    ...props.widgetContents.slice(0, index),
    updatedItem,
    ...props.widgetContents.slice(index + 1),
  ];

  emit("update:widgetContents", updatedContents);
}
</script>
<style></style>
