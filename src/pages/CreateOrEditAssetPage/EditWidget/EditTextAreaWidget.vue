<template>
  <EditWidgetLayout
    :widgetContents="widgetContents"
    :widgetDef="widgetDef"
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
        $emit('update:widgetContents', widgetContents as Type.WithUuid<Type.TextWidgetContent>[]);
      }
    ">
    <template #fieldContents="{ item }">
      <div>
        <label :for="`${item.uuid}-input`" class="sr-only">
          {{ widgetDef.label }}
        </label>
        <TextEditor
          :id="`${item.uuid}-input`"
          :modelValue="(item as Type.WithUuid<Type.TextAreaWidgetContent>).fieldContents ?? ''"
          :placeholder="widgetDef.label"
          class="bg-surface-container border border-outline-variant rounded-lg"
          :contentEditableAttrs="{
            role: 'textbox',
            'aria-multiline': 'true',
          }"
          @update:modelValue="
            (html) =>
              $emit(
                'update:widgetContents',
                ops.makeUpdateContentPayload(widgetContents, item.uuid, html)
              )
          " />
      </div>
    </template>
  </EditWidgetLayout>
</template>
<script setup lang="ts">
import { defineAsyncComponent } from "vue";
import * as Type from "@/types";
import EditWidgetLayout from "./EditWidgetLayout.vue";
import * as ops from "./helpers/editWidgetOps";

// Lazy — vue-quilly + Quill plugins only load when a curator is actually
// editing a text widget.
const TextEditor = defineAsyncComponent(
  () => import("@/components/TextEditor/TextEditor.vue")
);

defineProps<{
  widgetDef: Type.TextWidgetDef;
  widgetContents: Type.WithUuid<Type.TextWidgetContent>[];
  isOpen: boolean;
}>();

defineEmits<{
  (
    e: "update:widgetContents",
    widgetContents: Type.WithUuid<Type.TextWidgetContent>[]
  ): void;
  (e: "update:isOpen", isOpen: boolean): void;
}>();

// Note: textarea content cleaning now happens automatically before save in `toSaveableFormData()`in the asset editor.
</script>
