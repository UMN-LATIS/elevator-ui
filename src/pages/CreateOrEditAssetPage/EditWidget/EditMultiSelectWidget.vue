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
        $event as Type.WithId<Type.MultiSelectWidgetContent>[]
      )
    ">
    <template #fieldContents="{ item }">
      <SimpleCascadeSelect
        :id="`${item.id}-select`"
        :modelValue="item.fieldContents"
        :options="widgetDef.fieldData"
        :showLabel="false"
        @update:modelValue="handleUpdateFieldContents(item.id, $event)" />
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
  widgetContents: Type.WithId<Type.MultiSelectWidgetContent>[];
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (
    e: "update:widgetContents",
    widgetContents: Type.WithId<Type.MultiSelectWidgetContent>[]
  ): void;
  (e: "update:isOpen", isOpen: boolean): void;
}>();

const updateWidgetContents = (
  contents: Type.WithId<Type.MultiSelectWidgetContent>[]
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
    if (contentItem.id !== itemId) return contentItem;

    return {
      ...contentItem,
      fieldContents: updatedFieldContents,
    };
  });
  emit("update:widgetContents", updated);
};
</script>

<style>
.edit-multiselect-widget .cascade-select select {
  @apply bg-black/5 border-none;
}
</style>
