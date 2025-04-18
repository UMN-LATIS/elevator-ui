<template>
  <EditWidgetLayout
    :widgetContents="widgetContents"
    :widgetDef="widgetDef"
    class="edit-multiselect-widget"
    @add="handleAdd"
    @setPrimary="handleSetPrimary"
    @delete="handleDelete"
    @update:widgetContents="updateWidgetContents">
    <template #fieldContents="{ item }">
      <CascadeSelect
        :id="`${item.id}-select`"
        :options="widgetDef.fieldData"
        :initialSelectedValues="
          toCascadeSelectPath(widgetDef.fieldData, item.fieldContents)
        "
        :showLabel="false"
        @change="(path) => handleFieldUpdate(item.id, path)" />
    </template>
  </EditWidgetLayout>
</template>

<script setup lang="ts">
import * as Type from "@/types";
import EditWidgetLayout from "./EditWidgetLayout.vue";
import * as ops from "../editWidgetOps";
import CascadeSelect from "@/components/CascadeSelect/CascadeSelect.vue";
import { findDeepestPath } from "./helpers/findDeepestPath";

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
 * Event handler functions for managing widget contents
 */

/**
 * Updates widget contents and emits the change
 * @param contents - The new widget contents
 */
const updateWidgetContents = (
  contents: Type.WithId<Type.MultiSelectWidgetContent>[]
) => emit("update:widgetContents", contents);

/**
 * Handles the add event by creating a new widget content
 * @example Called when user clicks add button
 */
const handleAdd = () =>
  updateWidgetContents(
    ops.addWidgetContent(props.widgetContents, props.widgetDef)
  );

/**
 * Sets the primary item in the widget contents
 * @param id - ID of the item to make primary
 */
const handleSetPrimary = (id: string) =>
  updateWidgetContents(ops.setPrimaryItem(props.widgetContents, id));

/**
 * Deletes an item from the widget contents
 * @param id - ID of the item to delete
 */
const handleDelete = (id: string) =>
  updateWidgetContents(ops.deleteWidgetContent(props.widgetContents, id));

/**
 * Updates a specific field's content when selection changes
 * @example When user selects "USA" > "California" > "Los Angeles"
 * @param itemId - ID of the item being updated
 * @param path - Array of selected values from the cascade
 */
const handleFieldUpdate = (itemId: string, path: string[]) => {
  const hierarchy = getFieldHierarchy(props.widgetDef.fieldData);
  const contents = toFieldContents(hierarchy, path);
  updateWidgetContents(
    ops.updateWidgetContentItem(props.widgetContents, itemId, contents)
  );
};

/**
 * Extracts the field hierarchy from the fieldData structure.
 * Finds the deepest possible path through the nested structure.
 *
 * @example
 * // For fieldData:
 * {
 *   country: {
 *     usa: {
 *       state: {
 *         california: { city: ["los angeles", "san francisco"] }
 *       }
 *     },
 *     canada: {
 *       province: {
 *         ontario: {} // Less deep branch
 *       }
 *     }
 *   }
 * }
 * // Returns: ["country", "state", "city"]
 *
 * @param fieldData - The nested field data structure
 * @returns Array of field type names in hierarchical order
 */
function getFieldHierarchy(fieldData: Type.MultiSelectFieldData): string[] {
  const deepestPath = findDeepestPath(fieldData);
  // odd path keys are field types, even path keys are values
  return deepestPath.filter((_, index) => index % 2 === 0);
}

/**
 * Converts fieldContents object to a path array for CascadeSelect.
 *
 * @example
 * // For fieldData structure that yields hierarchy ["country", "state", "city"]
 * // and fieldContents:
 * {
 *   country: "usa",
 *   state: "minnesota",
 *   city: "minneapolis"
 * }
 * // Returns: ["usa", "minnesota", "minneapolis"]
 */
function toCascadeSelectPath(
  fieldData: Type.MultiSelectFieldData,
  fieldContents: Type.MultiSelectWidgetContent["fieldContents"]
): string[] {
  if (!fieldContents || Object.keys(fieldContents).length === 0) {
    return [] as string[];
  }

  const hierarchy = getFieldHierarchy(fieldData);

  return hierarchy
    .map((level) => fieldContents[level])
    .filter(Boolean) as string[];
}

/**
 * Converts a path array to a field contents object.
 *
 * @example
 * // For hierarchy: ["country", "state", "city"]
 * // and valuePath: ["usa", "california", "los angeles"]
 * // Returns:
 * {
 *   country: "usa",
 *   state: "california",
 *   city: "los angeles"
 * }
 */
function toFieldContents(
  hierarchy: string[],
  valuePath: string[]
): Record<string, string> {
  if (!valuePath.length) return {};

  return hierarchy.slice(0, valuePath.length).reduce(
    (result, key, index) => ({
      ...result,
      [key]: valuePath[index],
    }),
    {}
  );
}
</script>

<style>
.edit-multiselect-widget .cascade-select select {
  @apply bg-black/5 border-none;
}
</style>
