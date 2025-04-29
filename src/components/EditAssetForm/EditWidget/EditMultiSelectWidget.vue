<template>
  <EditWidgetLayout
    :widgetContents="widgetContents"
    :widgetDef="widgetDef"
    :isOpen="isOpen"
    class="edit-multiselect-widget"
    @update:isOpen="$emit('update:isOpen', $event)"
    @add="handleAdd"
    @setPrimary="handleSetPrimary"
    @delete="handleDelete"
    @update:widgetContents="
      updateWidgetContents(
        $event as Type.WithId<Type.MultiSelectWidgetContent>[]
      )
    ">
    <template #fieldContents="{ item }">
      <CascadeSelect
        :id="`${item.id}-select`"
        :options="widgetDef.fieldData"
        :initialSelectedValues="
          toCascadeSelectPath(widgetDef.fieldData, item.fieldContents as Type.MultiSelectWidgetContent['fieldContents'])
        "
        labelClass="font-medium"
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
import { toRaw, toValue } from "vue";

const props = defineProps<{
  assetId: string;
  widgetDef: Type.MultiSelectWidgetProps;
  widgetContents: Type.WithId<Type.MultiSelectWidgetContent>[];
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (
    e: "update:widgetContents",
    widgetContents: Type.WithId<Type.MultiSelectWidgetContent>[]
  ): void;
  (e: "update:isOpen", isOpen: boolean): void;
}>();

const updateWidgetContents = (
  contents: Type.WithId<Type.MultiSelectWidgetContent>[]
) => emit("update:widgetContents", contents);

const handleAdd = () =>
  updateWidgetContents(
    ops.makeAddContentPayload(props.widgetContents, props.widgetDef)
  );

const handleSetPrimary = (id: string) =>
  updateWidgetContents(
    ops.makeSetPrimaryContentPayload(props.widgetContents, id)
  );

const handleDelete = (id: string) =>
  updateWidgetContents(ops.deleteWidgetContent(props.widgetContents, id));

const handleFieldUpdate = (itemId: string, path: string[]) => {
  const hierarchy = getFieldHierarchy(props.widgetDef.fieldData);
  const contents = toFieldContents(hierarchy, path);
  updateWidgetContents(
    ops.makeUpdateContentPayload(props.widgetContents, itemId, contents)
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
  console.log({
    fieldData: toRaw(fieldData),
    fieldContents: toRaw(fieldContents),
  });
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
