<template>
  <EditWidgetLayout
    :widgetContents="widgetContents"
    :widgetDef="widgetDef"
    class="edit-multiselect-widget"
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
      <div class="bg-black/5 rounded-md p-4">
        <pre>{{ JSON.stringify(item.fieldContents, null, 2) }}</pre>

        <CascadeSelect
          :id="`${item.id}-select`"
          :label="widgetDef.label"
          :options="cascadeSelectOptions"
          :initialSelectedValues="
            toCascadeSelectPath(widgetDef.fieldData, item.fieldContents ?? [])
          "
          :showLabel="false"
          @change="
            (updatedPath) => {
              const updatedContents = toMultiSelectFieldContents(
                widgetDef.fieldData,
                updatedPath
              );
              console.log('updatedContents', updatedContents);
              $emit(
                'update:widgetContents',
                ops.updateWidgetContentItem(
                  widgetContents,
                  item.id,
                  updatedContents
                )
              );
            }
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
import CascadeSelect from "@/components/CascadeSelect/CascadeSelect.vue";
import {
  toCascadeSelectOptions,
  toCascadeSelectPath,
  toMultiSelectFieldContents,
} from "./EditMultiSelectWidgetHelpers";

const props = defineProps<{
  widgetDef: Type.MultiSelectWidgetProps;
  widgetContents: Type.WithId<Type.MultiSelectWidgetContent>[];
}>();

const emit = defineEmits<{
  (
    e: "update:widgetContents",
    widgetContents: Type.WithId<Type.MultiSelectWidgetContent>[]
  ): void;
}>();

const cascadeSelectOptions = computed(
  () =>
    // toCascadeSelectOptions(props.widgetDef.fieldData)
    props.widgetDef.fieldData
);
</script>
<style scoped></style>
<style>
.edit-multiselect-widget .cascade-select select {
  @apply bg-black/5 border-none;
}
</style>
