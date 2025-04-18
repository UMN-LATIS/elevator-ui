<template>
  <EditWidgetLayout
    :widgetContents="widgetContents"
    :widgetDef="widgetDef"
    :accordionDisabled="true"
    class="edit-checkbox-widget">
    <template #widgetContents>
      <div
        v-for="item in widgetContents"
        :key="item.id"
        class="lg:ml-[4.5rem] py-6 px-4">
        <div class="flex items-center space-x-2">
          <Switch
            :id="`${item.id}-checkbox`"
            :modelValue="item.fieldContents"
            @update:modelValue="
              $emit(
                'update:widgetContents',
                ops.makeUpdateContentPayload(widgetContents, item.id, $event)
              )
            " />
          <Label :for="`${item.id}-checkbox`">{{ widgetDef.label }}</Label>
        </div>
      </div>
    </template>
  </EditWidgetLayout>
</template>
<script setup lang="ts">
import * as Type from "@/types";
import EditWidgetLayout from "./EditWidgetLayout.vue";
import * as ops from "../editWidgetOps";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

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
