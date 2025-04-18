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
      (widgetContents) => $emit('update:widgetContents', widgetContents)
    ">
    <template #fieldContents="{ item }">
      <div>
        <CascadeSelect
          :id="`${item.id}-select`"
          class="cascade-select"
          :options="widgetDef.fieldData"
          :initialSelectedValues="toCascadeSelectPath(item.fieldContents ?? {})"
          :showLabel="false"
          @change="
            (updatedPath) => updateFieldContents(item.id, updatedPath)
          " />
      </div>
    </template>
  </EditWidgetLayout>
</template>
<script setup lang="ts">
import * as Type from "@/types";
import EditWidgetLayout from "./EditWidgetLayout.vue";
import * as ops from "../editWidgetOps";
import CascadeSelect from "@/components/CascadeSelect/CascadeSelect.vue";

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

/**
 * Gets the hierarchy of field types from the fieldData
 */
function getFieldHierarchy(fieldData: Type.MultiSelectFieldData): string[] {
  const hierarchy: string[] = [];
  let current: any = fieldData;

  while (current && typeof current === "object") {
    const key = Object.keys(current)[0];
    if (!key) break;

    hierarchy.push(key);
    const nextVal = current[key];

    // If we've hit an array, we're at the end
    if (Array.isArray(nextVal)) break;

    // Get a sample value to traverse deeper
    const sampleKey = Object.keys(nextVal)[0];
    if (!sampleKey) break;

    current = nextVal[sampleKey];
  }

  return hierarchy;
}

/**
 * Converts the field contents to a path of values for CascadeSelect
 */
function toCascadeSelectPath(fieldContents: object): string[] {
  if (!fieldContents || Object.keys(fieldContents).length === 0) {
    return [];
  }

  const hierarchy = getFieldHierarchy(props.widgetDef.fieldData);
  const path: string[] = [];

  // Build path following the hierarchy order
  for (const level of hierarchy) {
    if (!fieldContents[level]) break;
    path.push(fieldContents[level] as string);
  }

  return path;
}

/**
 * Transforms a path of values into a field contents object
 */
function toMultiSelectFieldContents(valuePath: string[]): object {
  const result = {};

  if (!valuePath.length) return result;

  const hierarchy = getFieldHierarchy(props.widgetDef.fieldData);

  // Build the result object following the hierarchy
  for (let i = 0; i < Math.min(valuePath.length, hierarchy.length); i++) {
    result[hierarchy[i]] = valuePath[i];
  }

  return result;
}

/**
 * Updates the field contents when the cascade selection changes
 */
function updateFieldContents(itemId: string, updatedPath: string[]): void {
  const updatedContents = toMultiSelectFieldContents(updatedPath);

  emit(
    "update:widgetContents",
    ops.updateWidgetContentItem(props.widgetContents, itemId, updatedContents)
  );
}
</script>
<style scoped></style>
<style>
.edit-multiselect-widget .cascade-select select {
  @apply bg-black/5 border-none;
}
</style>
