<template>
  <EditWidgetLayout
    :widgetContents="widgetContents"
    :widgetDef="widgetDef"
    class="edit-text-widget"
    @add="handleAddWidgetContent"
    @setPrimary="setPrimaryItem">
    <template #fieldContents="{ item }">
      <div>
        <label :for="`${item.id}-input`" class="sr-only">
          {{ widgetDef.label }}
        </label>
        <Input
          :id="`${item.id}-input`"
          :modelValue="item.fieldContents"
          :placeholder="widgetDef.label"
          class="bg-black/5 border-none"
          @update:modelValue="handleUpdateWidgetContentItem(item.id, $event)" />
      </div>
    </template>
  </EditWidgetLayout>
</template>
<script setup lang="ts">
import * as Type from "@/types";
import { Input } from "@/components/ui/input";
import EditWidgetLayout from "./EditWidgetLayout.vue";
import { createDefaultWidgetContent } from "@/helpers/createDefaultWidgetContents";

const props = defineProps<{
  widgetDef: Type.TextWidgetProps;
  widgetContents: Type.WithId<Type.TextWidgetContent>[];
}>();

const emit = defineEmits<{
  (
    e: "update:widgetContents",
    widgetContents: Type.WithId<Type.TextWidgetContent>[]
  ): void;
}>();

function setPrimaryItem(id: string) {
  const updatedWidgetContents = props.widgetContents.map((item) => {
    return {
      ...item,
      isPrimary: item.id === id,
    };
  });
  emit("update:widgetContents", updatedWidgetContents);
}

function handleAddWidgetContent() {
  const newItem = createDefaultWidgetContent(
    props.widgetDef
  ) as Type.WithId<Type.TextWidgetContent>;
  emit("update:widgetContents", [...props.widgetContents, newItem]);
}

function handleUpdateWidgetContentItem(id: string, fieldContents: string) {
  const updatedWidgetContents = props.widgetContents.map((item) => {
    if (item.id !== id) return item;
    return {
      ...item,
      fieldContents,
    };
  });
  emit("update:widgetContents", updatedWidgetContents);
}
</script>
<style scoped></style>
<style></style>
