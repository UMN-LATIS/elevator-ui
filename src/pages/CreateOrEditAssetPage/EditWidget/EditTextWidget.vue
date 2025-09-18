<template>
  <EditWidgetLayout
    :widgetContents="widgetContents"
    :widgetDef="widgetDef"
    class="edit-text-widget"
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
        $emit('update:widgetContents', widgetContents as Type.WithId<Type.TextWidgetContent>[]);
      }
    ">
    <template #fieldContents="{ item }">
      <div>
        <label :for="`${item.id}-input`" class="sr-only">
          {{ widgetDef.label }}
        </label>

        <!-- Autocomplete Text Input -->
        <div v-if="widgetDef.attemptAutocomplete">
          <AutoCompleteInput
            :id="`${item.id}-input`"
            :modelValue="(item as Type.WithId<Type.TextWidgetContent>).fieldContents"
            :placeholder="widgetDef.label"
            :fieldTitle="widgetDef.fieldTitle"
            :templateId="templateId"
            inputClass="w-full bg-black/5 border-none rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            @update:modelValue="(value) => handleFieldUpdate(item, value)"
            @update:searchTerm="(value) => handleFieldUpdate(item, value)" />
        </div>

        <!-- Regular Text Input -->
        <Input
          v-else
          :id="`${item.id}-input`"
          :modelValue="(item as Type.WithId<Type.TextWidgetContent>).fieldContents"
          :placeholder="widgetDef.label"
          class="bg-black/5 border-none"
          @update:modelValue="
            (value) =>
              $emit(
                'update:widgetContents',
                ops.makeUpdateContentPayload(widgetContents, item.id, value)
              )
          " />
      </div>
    </template>
  </EditWidgetLayout>
</template>
<script setup lang="ts">
import * as Type from "@/types";
import { Input } from "@/components/ui/input";
import EditWidgetLayout from "./EditWidgetLayout.vue";
import AutoCompleteInput from "@/components/AutoCompleteInput/AutoCompleteInput.vue";
import * as ops from "./helpers/editWidgetOps";
import { computed } from "vue";
import { useAssetEditor } from "../useAssetEditor/useAssetEditor";
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

const parentAssetEditor = useAssetEditor();
const templateId = computed(() => {
  invariant(parentAssetEditor);
  return parentAssetEditor.templateId;
});

// Handle field updates from AutoCompleteInput
function handleFieldUpdate(
  item: Type.WithId<Type.TextWidgetContent>,
  value: string
) {
  emit(
    "update:widgetContents",
    ops.makeUpdateContentPayload(props.widgetContents, item.id, value)
  );
}
</script>
<style scoped></style>
<style></style>
