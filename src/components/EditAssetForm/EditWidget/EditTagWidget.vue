<template>
  <EditWidgetLayout
    :widgetContents="widgetContents"
    :widgetDef="widgetDef"
    class="edit-tag-widget"
    @add="handleAdd"
    @setPrimary="handleSetPrimary"
    @delete="handleDelete"
    @update:widgetContents="updateWidgetContents">
    <template #fieldContents="{ item }">
      {{ item }}
      {{ widgetContents }}
      <TagsInput
        :modelValue="item.tags ?? []"
        class="tags-input"
        @update:modelValue="(updated) => handleUpdateTags(item.id, updated as string[])">
        <TagsInputItem v-for="tag in item.tags" :key="tag" :value="tag">
          <TagsInputItemText />
          <TagsInputItemDelete />
        </TagsInputItem>

        <TagsInputInput :placeholder="`${widgetDef.label}...`" />
      </TagsInput>
    </template>
  </EditWidgetLayout>
</template>

<script setup lang="ts">
import * as Type from "@/types";
import EditWidgetLayout from "./EditWidgetLayout.vue";
import * as ops from "../editWidgetOps";
import {
  TagsInput,
  TagsInputItem,
  TagsInputItemText,
  TagsInputItemDelete,
  TagsInputInput,
} from "@/components/ui/tags-input";

// TODO: allow multiple, probably just means multiple TAGS, not multiple fields?

const props = defineProps<{
  widgetDef: Type.TagListWidgetProps;
  widgetContents: Type.WithId<Type.TagListWidgetContent>[];
}>();

const emit = defineEmits<{
  (
    e: "update:widgetContents",
    widgetContents: Type.WithId<Type.TagListWidgetContent>[]
  ): void;
}>();

const handleAdd = () =>
  emit(
    "update:widgetContents",
    ops.makeAddContentPayload(props.widgetContents, props.widgetDef)
  );

const handleSetPrimary = (id: string) =>
  emit(
    "update:widgetContents",
    ops.makeSetPrimaryContentPayload(props.widgetContents, id)
  );

const handleDelete = (id: string) =>
  emit(
    "update:widgetContents",
    ops.deleteWidgetContent(props.widgetContents, id)
  );

const handleUpdateTags = (
  itemId: string,
  tags: Type.TagListWidgetContent["tags"]
) => {
  emit(
    "update:widgetContents",
    ops.makeUpdateContentPayload(props.widgetContents, itemId, tags)
  );
};
</script>

<style scoped></style>
