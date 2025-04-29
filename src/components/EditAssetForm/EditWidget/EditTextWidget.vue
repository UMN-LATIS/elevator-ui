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
        <Input
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
