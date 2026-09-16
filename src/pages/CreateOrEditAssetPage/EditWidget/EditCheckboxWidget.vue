<template>
  <EditWidgetLayout
    :widgetContents="widgetContents"
    :widgetDef="widgetDef"
    :isOpen="isOpen"
    class="edit-checkbox-widget"
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
        $emit('update:widgetContents', widgetContents as Type.WithUuid<Type.CheckboxWidgetContent>[]);
      }
    ">
    <template #fieldContents="{ item }">
      <div class="flex gap-2">
        <input
          :id="`${item.uuid}-checkbox`"
          type="checkbox"
          :checked="(item as Type.WithUuid<Type.CheckboxWidgetContent>).fieldContents"
          class="rounded-sm border-outline-variant checked:border-outline-variant focus:ring-2 focus:ring-primary"
          @change="
            (event) =>
            $emit(
              'update:widgetContents',
              ops.makeUpdateContentPayload(
                widgetContents,
                item.uuid,
                (event.target as HTMLInputElement).checked
              )
            )
          " />
        <Label :for="`${item.uuid}-checkbox`">
          {{ widgetDef.label }}
        </Label>
      </div>
    </template>
  </EditWidgetLayout>
</template>
<script setup lang="ts">
import * as Type from "@/types";
import EditWidgetLayout from "./EditWidgetLayout.vue";
import * as ops from "./helpers/editWidgetOps";
import { Label } from "@/components/ui/label";

defineProps<{
  widgetDef: Type.TextWidgetDef;
  widgetContents: Type.WithUuid<Type.CheckboxWidgetContent>[];
  isOpen: boolean;
}>();

defineEmits<{
  (
    e: "update:widgetContents",
    widgetContents: Type.WithUuid<Type.CheckboxWidgetContent>[]
  ): void;
  (e: "update:isOpen", isOpen: boolean): void;
}>();
</script>
<style></style>
