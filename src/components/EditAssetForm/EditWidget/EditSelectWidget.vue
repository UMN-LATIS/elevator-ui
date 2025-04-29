<template>
  <EditWidgetLayout
    :isOpen="isOpen"
    :widgetContents="widgetContents"
    :widgetDef="widgetDef"
    class="edit-select-widget"
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
        $emit('update:widgetContents', widgetContents as Type.WithId<Type.SelectWidgetContent>[]);
      }
    ">
    <template #fieldContents="{ item }">
      <div>
        <SelectGroup
          :id="`${item.id}-select`"
          :modelValue="(item as Type.WithId<Type.SelectWidgetContent>).fieldContents ?? ''"
          :label="widgetDef.label"
          :options="selectOptions"
          :showLabel="false"
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
import EditWidgetLayout from "./EditWidgetLayout.vue";
import * as ops from "../editWidgetOps";
import { computed } from "vue";
import SelectGroup from "@/components/SelectGroup/SelectGroup.vue";

const props = defineProps<{
  widgetDef: Type.SelectWidgetProps;
  widgetContents: Type.WithId<Type.SelectWidgetContent>[];
  isOpen: boolean;
}>();

defineEmits<{
  (
    e: "update:widgetContents",
    widgetContents: Type.WithId<Type.SelectWidgetContent>[]
  ): void;
  (e: "update:isOpen", isOpen: boolean): void;
}>();

const selectOptions = computed((): Type.SelectOption[] => {
  const options = props.widgetDef.fieldData.selectGroup;
  if (!options) {
    return [];
  }

  if (Array.isArray(options)) {
    return options.map((option) => ({
      id: option,
      label: option,
    }));
  }

  return Object.entries(options).map(([key, value]) => ({
    id: key.toString(),
    label: value?.toString() ?? key.toString(),
  }));
});
</script>
<style scoped></style>
<style></style>
