<template>
  <EditWidgetLayout
    :widgetContents="widgetContents"
    :widgetDef="widgetDef"
    class="edit-text-widget"
    @add="
      $emit(
        'update:widgetContents',
        ops.addWidgetContent(widgetContents, widgetDef)
      )
    "
    @setPrimary="
      (id) =>
        $emit('update:widgetContents', ops.setPrimaryItem(widgetContents, id))
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
      <div>
        <label :for="`${item.id}-input`" class="sr-only">
          {{ widgetDef.label }}
        </label>
        <Input
          :id="`${item.id}-input`"
          :modelValue="item.fieldContents"
          :placeholder="widgetDef.label"
          class="bg-black/5 border-none"
          @update:modelValue="
            (value) =>
              $emit(
                'update:widgetContents',
                ops.updateWidgetContentItem(widgetContents, item.id, value)
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
import * as ops from "../editWidgetOps";

defineProps<{
  widgetDef: Type.TextWidgetProps;
  widgetContents: Type.WithId<Type.TextWidgetContent>[];
}>();

defineEmits<{
  (
    e: "update:widgetContents",
    widgetContents: Type.WithId<Type.TextWidgetContent>[]
  ): void;
}>();
</script>
<style scoped></style>
<style></style>
