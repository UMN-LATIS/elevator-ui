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
        $emit('update:widgetContents', widgetContents as Type.WithId<Type.CheckboxWidgetContent>[]);
      }
    ">
    <template #fieldContents="{ item }">
      <div class="flex gap-2">
        <input
          :id="`${item.id}-checkbox`"
          type="checkbox"
          :checked="(item as Type.WithId<Type.CheckboxWidgetContent>).fieldContents"
          class="rounded-sm checked:bg-m3-primary"
          @change="
            (event) =>
            $emit(
              'update:widgetContents',
              ops.makeUpdateContentPayload(
                widgetContents,
                item.id,
                (event.target as HTMLInputElement).checked
              )
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
import * as ops from "./helpers/editWidgetOps";
import { Label } from "@/components/ui/label";

defineProps<{
  widgetDef: Type.TextWidgetDef;
  widgetContents: Type.WithId<Type.CheckboxWidgetContent>[];
  isOpen: boolean;
}>();

defineEmits<{
  (
    e: "update:widgetContents",
    widgetContents: Type.WithId<Type.CheckboxWidgetContent>[]
  ): void;
  (e: "update:isOpen", isOpen: boolean): void;
}>();
</script>
<style scoped></style>
<style></style>
