<template>
  <EditWidgetLayout
    :widgetContents="widgetContents"
    :widgetDef="widgetDef"
    class="edit-tag-widget"
    :isOpen="isOpen"
    @update:isOpen="$emit('update:isOpen', $event)"
    @add="handleAdd"
    @setPrimary="handleSetPrimary"
    @delete="handleDelete"
    @update:widgetContents="
      $emit(
        'update:widgetContents',
        $event as Type.WithId<Type.TagListWidgetContent>[]
      )
    ">
    <template #fieldContents="{ item }">
      <TagsInput
        :modelValue="(item.tags as string[])"
        :addOnBlur="true"
        class="tags-input !py-0"
        @update:modelValue="(tags) => handleUpdateTags(item.id, tags as string[])">
        <TagsInputItem
          v-for="tag in item.tags"
          :key="tag"
          :value="tag"
          class="bg-neutral-900 text-neutral-100 h-auto"
          data-testid="tag-item">
          <TagsInputItemText />
          <TagsInputItemDelete />
        </TagsInputItem>

        <AutoCompleteInput
          v-if="widgetDef.attemptAutocomplete"
          :id="`edit-tag-widget-autocomplete-${item.id}`"
          v-model="tagInput"
          :placeholder="`${widgetDef.label}...`"
          :fieldTitle="widgetDef.fieldTitle"
          :templateId="templateId"
          inputClass="!py-0 flex-1 min-w-24"
          :blurOnSelect="false"
          @blur="(value) => handleTagUpdate(item.id, value)"
          @select="(selection) => handleTagUpdate(item.id, selection)"
          @keydown="(event) => handleKeydown(item.id, event)" />
        <TagsInputInput v-else :placeholder="`${widgetDef.label}...`" />
      </TagsInput>
    </template>
  </EditWidgetLayout>
</template>

<script setup lang="ts">
import * as Type from "@/types";
import EditWidgetLayout from "./EditWidgetLayout.vue";
import * as ops from "./helpers/editWidgetOps";
import {
  TagsInput,
  TagsInputItem,
  TagsInputItemText,
  TagsInputItemDelete,
  TagsInputInput,
} from "@/components/ui/tags-input";
import AutoCompleteInput from "@/components/AutoCompleteInput/AutoCompleteInput.vue";
import { computed, ref, nextTick } from "vue";
import { useAssetEditor } from "../useAssetEditor/useAssetEditor";
import invariant from "tiny-invariant";

const props = defineProps<{
  widgetDef: Type.TagListWidgetDef;
  widgetContents: Type.WithId<Type.TagListWidgetContent>[];
  isOpen: boolean;
}>();

const tagInput = ref("");

const parentAssetEditor = useAssetEditor();

const templateId = computed(() => {
  invariant(parentAssetEditor, "Parent asset editor is required");
  return parentAssetEditor.templateId;
});

const emit = defineEmits<{
  (
    e: "update:widgetContents",
    widgetContents: Type.WithId<Type.TagListWidgetContent>[]
  ): void;
  (e: "update:isOpen", isOpen: boolean): void;
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
    ops.makeUpdateContentPayload(props.widgetContents, itemId, tags, "tags")
  );
};

function handleTagUpdate(itemId: string, value: string) {
  tagInput.value = value;

  const trimmedValue = value.trim();

  // If the input is empty, no change is needed
  if (!trimmedValue.length) return;

  const existingTags =
    props.widgetContents.find((content) => content.id === itemId)?.tags || [];

  // If the tag already exists, no change is needed
  if (existingTags.includes(trimmedValue)) {
    tagInput.value = ""; // Clear input if tag already exists
    return;
  }

  emit(
    "update:widgetContents",
    ops.makeUpdateContentPayload(
      props.widgetContents,
      itemId,
      [...existingTags, trimmedValue],
      "tags"
    )
  );

  // Clear the tag input after updating
  nextTick(() => {
    tagInput.value = "";
  });
}

function removeLastTag(itemId: string) {
  const item = props.widgetContents.find((content) => content.id === itemId);
  const tags = item?.tags || [];

  const updatedTags = tags.slice(0, -1); // Remove the last tag
  emit(
    "update:widgetContents",
    ops.makeUpdateContentPayload(
      props.widgetContents,
      itemId,
      updatedTags,
      "tags"
    )
  );
}

async function handleKeydown(itemId: string, event: KeyboardEvent) {
  const ADD_TAG_KEYS = [",", "Tab", "Enter"];

  if (ADD_TAG_KEYS.includes(event.key)) {
    event.preventDefault();
    await nextTick(); // make sure that tagInput is updated
    handleTagUpdate(itemId, tagInput.value);
    return;
  }

  // delete the previous tag on backspace if the input is empty
  if (event.key === "Backspace" && tagInput.value === "") {
    event.preventDefault();
    removeLastTag(itemId);
  }
}
</script>

<style scoped></style>
