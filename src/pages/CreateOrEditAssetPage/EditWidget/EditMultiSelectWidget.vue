<template>
  <EditWidgetLayout
    :widgetContents="widgetContents"
    :widgetDef="widgetDef"
    :isOpen="isOpen"
    class="edit-multiselect-widget"
    @update:isOpen="$emit('update:isOpen', $event)"
    @add="handleAdd"
    @setPrimary="handleSetPrimary"
    @delete="handleDelete"
    @update:widgetContents="
      updateWidgetContents(
        $event as Type.WithUuid<Type.MultiSelectWidgetContent>[]
      )
    ">
    <template #fieldContents="{ item }">
      <SimpleCascadeSelect
        :id="`${item.uuid}-select`"
        :modelValue="item.fieldContents"
        :options="widgetDef.fieldData"
        :showLabel="false"
        @update:modelValue="handleUpdateFieldContents(item.uuid, $event)" />
    </template>
  </EditWidgetLayout>
</template>

<script setup lang="ts">
import * as Type from "@/types";
import EditWidgetLayout from "./EditWidgetLayout.vue";
import * as ops from "./helpers/editWidgetOps";
import SimpleCascadeSelect from "@/components/CascadeSelect/SimpleCascadeSelect.vue";

const props = defineProps<{
  widgetDef: Type.MultiSelectWidgetDef;
  widgetContents: Type.WithUuid<Type.MultiSelectWidgetContent>[];
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (
    e: "update:widgetContents",
    widgetContents: Type.WithUuid<Type.MultiSelectWidgetContent>[]
  ): void;
  (e: "update:isOpen", isOpen: boolean): void;
}>();

const updateWidgetContents = (
  contents: Type.WithUuid<Type.MultiSelectWidgetContent>[]
) => emit("update:widgetContents", contents);

const handleAdd = () =>
  updateWidgetContents(
    ops.makeAddContentPayload(props.widgetContents, props.widgetDef)
  );

const handleSetPrimary = (id: string) =>
  updateWidgetContents(
    ops.makeSetPrimaryContentPayload(props.widgetContents, id)
  );

const handleDelete = (id: string) =>
  updateWidgetContents(ops.deleteWidgetContent(props.widgetContents, id));

const handleUpdateFieldContents = (
  itemId: string,
  updatedFieldContents: Type.MultiSelectWidgetContent["fieldContents"]
) => {
  const updated = props.widgetContents.map((contentItem) => {
    if (contentItem.uuid !== itemId) return contentItem;

    return {
      ...contentItem,
      fieldContents: updatedFieldContents,
    };
  });
  emit("update:widgetContents", updated);
};
</script>

<style></style>
