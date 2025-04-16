<template>
  <EditWidgetLayout
    :widgetContents="widgetContents"
    :widgetDef="widgetDef"
    class="edit-textarea-widget"
    @add="handleAddWidgetContent"
    @setPrimary="setPrimaryItem">
    <template #fieldContents="{ item }">
      <div>
        <label :for="`${item.id}-input`" class="sr-only">
          {{ widgetDef.label }}
        </label>
        <TextEditor
          :id="`${item.id}-input`"
          :modelValue="item.fieldContents"
          :placeholder="widgetDef.label"
          class="bg-black/5 border-none rounded-lg"
          :contentEditableAttrs="{
            role: 'textbox',
            'aria-multiline': 'true',
          }"
          @update:modelValue="handleUpdateWidgetContentItem(item.id, $event)" />
      </div>
    </template>
  </EditWidgetLayout>
</template>
<script setup lang="ts">
import * as Type from "@/types";
import EditWidgetLayout from "./EditWidgetLayout.vue";
import TextEditor from "@/components/TextEditor/TextEditor.vue";
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
</script>
<style scoped></style>
<style></style>
