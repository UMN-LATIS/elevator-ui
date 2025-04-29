<template>
  <EditWidgetLayout
    :widgetContents="widgetContents"
    :widgetDef="widgetDef"
    :isOpen="isOpen"
    class="edit-textarea-widget"
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
        $emit('update:widgetContents', widgetContents as Type.WithId<Type.TextWidgetContent>[]);
      }
    ">
    <template #fieldContents="{ item }">
      <div>
        <label :for="`${item.id}-input`" class="sr-only">
          {{ widgetDef.label }}
        </label>
        <TextEditor
          :id="`${item.id}-input`"
          :modelValue="(item as Type.WithId<Type.TextAreaWidgetContent>).fieldContents ?? ''"
          :placeholder="widgetDef.label"
          class="bg-black/5 border-none rounded-lg"
          :contentEditableAttrs="{
            role: 'textbox',
            'aria-multiline': 'true',
          }"
          @update:modelValue="
            (html) =>
              $emit(
                'update:widgetContents',
                ops.makeUpdateContentPayload(widgetContents, item.id, html)
              )
          " />
      </div>
    </template>
  </EditWidgetLayout>
</template>
<script setup lang="ts">
import * as Type from "@/types";
import EditWidgetLayout from "./EditWidgetLayout.vue";
import TextEditor from "@/components/TextEditor/TextEditor.vue";
import * as ops from "../editWidgetOps";

defineProps<{
  widgetDef: Type.TextWidgetProps;
  widgetContents: Type.WithId<Type.TextWidgetContent>[];
  isOpen: boolean;
}>();

defineEmits<{
  (
    e: "update:widgetContents",
    widgetContents: Type.WithId<Type.TextWidgetContent>[]
  ): void;
  (e: "update:isOpen", isOpen: boolean): void;
}>();
</script>
<style scoped></style>
<style></style>
