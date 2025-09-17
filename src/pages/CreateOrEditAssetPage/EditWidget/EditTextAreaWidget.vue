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
import * as ops from "./helpers/editWidgetOps";
import { inject, onMounted } from "vue";
import { ASSET_EDITOR_PROVIDE_KEY } from "@/constants/constants";
import invariant from "tiny-invariant";

const props = defineProps<{
  widgetDef: Type.TextWidgetDef;
  widgetContents: Type.WithId<Type.TextWidgetContent>[];
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (
    e: "update:widgetContents",
    widgetContents: Type.WithId<Type.TextWidgetContent>[]
  ): void;
  (e: "update:isOpen", isOpen: boolean): void;
}>();

const parentAssetEditor = inject(ASSET_EDITOR_PROVIDE_KEY);

// remove whitespace and empty paragraphs
function cleanFieldContents(html: string): string {
  const emptyParagraphRegex = /<p>(&nbsp;|\s|<br>)*<\/p>/g;
  const trimmed = html.trim().replace(emptyParagraphRegex, "");
  return trimmed;
}

onMounted(() => {
  invariant(parentAssetEditor);
  // register a beforeSave callback with the parent editor
  // to clean up field contents (e.g. removing empty paragraphs)
  // so that the asset view formatting is cleaner
  parentAssetEditor.onBeforeSave(async () => {
    const trimmedContents = props.widgetContents.map((content) => ({
      ...content,
      fieldContents: cleanFieldContents(content.fieldContents ?? ""),
    }));
    emit("update:widgetContents", trimmedContents);
  });
});
</script>
<style scoped>
/* Ensure the embedded Quill editor starts a bit taller */
.edit-textarea-widget :deep(.ql-container .ql-editor) {
  min-height: 6rem;
}
</style>
