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
      <TagsInput
        :modelValue="item.tags ?? []"
        class="tags-input"
        @update:modelValue="console.log">
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

const updateWidgetContents = (
  contents: Type.WithId<Type.TagListWidgetContent>[]
) => emit("update:widgetContents", contents);

const handleAdd = () =>
  updateWidgetContents(
    ops.addWidgetContent(props.widgetContents, props.widgetDef)
  );

const handleSetPrimary = (id: string) =>
  updateWidgetContents(ops.setPrimaryItem(props.widgetContents, id));

const handleDelete = (id: string) =>
  updateWidgetContents(ops.deleteWidgetContent(props.widgetContents, id));

const handleFieldUpdate = (
  itemId: string,
  fieldContents: Type.WithId<Type.TagListWidgetContent["tags"]>
) => {
  updateWidgetContents(
    ops.updateWidgetContentItem(props.widgetContents, itemId, fieldContents)
  );
};
</script>

<style scoped></style>
