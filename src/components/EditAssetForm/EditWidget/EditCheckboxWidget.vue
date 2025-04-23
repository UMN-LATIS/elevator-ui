<template>
  <EditWidgetLayout
    :widgetContents="widgetContents"
    :widgetDef="widgetDef"
    class="edit-checkbox-widget"
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
        $emit('update:widgetContents', widgetContents);
      }
    ">
    <template #fieldContents="{ item }">
      <div class="flex gap-2">
        <input
          :id="`${item.id}-checkbox`"
          type="checkbox"
          :modelValue="item.fieldContents"
          class="rounded-sm bg-black/5 border-black/25 checked:bg-blue-700"
          @update:modelValue="
            $emit(
              'update:widgetContents',
              ops.makeUpdateContentPayload(widgetContents, item.id, $event)
            )
          " />
        <Label :for="`${item.id}-checkbox`">
          {{ widgetDef.label }}
        </Label>
      </div>
    </template>
  </EditWidgetLayout>
</template>
<script setup lang="ts">
import * as Type from "@/types";
import EditWidgetLayout from "./EditWidgetLayout.vue";
import * as ops from "../editWidgetOps";
import { Label } from "@/components/ui/label";

defineProps<{
  widgetDef: Type.TextWidgetProps;
  widgetContents: Type.WithId<Type.CheckboxWidgetContent>[];
}>();

defineEmits<{
  (
    e: "update:widgetContents",
    widgetContents: Type.WithId<Type.CheckboxWidgetContent>[]
  ): void;
}>();
</script>
<style scoped></style>
<style></style>
