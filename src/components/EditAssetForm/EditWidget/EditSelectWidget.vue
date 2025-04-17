<template>
  <EditWidgetLayout
    :widgetContents="widgetContents"
    :widgetDef="widgetDef"
    class="edit-select-widget"
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
        <SelectGroup
          :id="`${item.id}-select`"
          :modelValue="item.fieldContents ?? ''"
          :label="widgetDef.label"
          :options="selectOptions"
          :showLabel="false"
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
import EditWidgetLayout from "./EditWidgetLayout.vue";
import * as ops from "../editWidgetOps";
import { computed } from "vue";
import SelectGroup from "@/components/SelectGroup/SelectGroup.vue";

const props = defineProps<{
  widgetDef: Type.SelectWidgetProps;
  widgetContents: Type.WithId<Type.SelectWidgetContent>[];
}>();

defineEmits<{
  (
    e: "update:widgetContents",
    widgetContents: Type.WithId<Type.SelectWidgetContent>[]
  ): void;
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
