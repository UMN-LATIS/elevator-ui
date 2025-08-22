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
          class="bg-neutral-900 text-neutral-100"
          data-testid="tag-item">
          <TagsInputItemText />
          <TagsInputItemDelete />
        </TagsInputItem>

        <AutoCompleteInput
          v-if="widgetDef.attemptAutocomplete"
          :id="`edit-tag-widget-autocomplete-${item.id}`"
          :modelValue="tagInput"
          :placeholder="`${widgetDef.label}...`"
          :fieldTitle="widgetDef.fieldTitle"
          :templateId="templateId"
          :inputClass="'!py-0'"
          :blurOnSelect="false"
          @update:modelValue="handleTagUpdate(item.id, $event)"
          @keydown="(event, ctx) => handleKeydown(item.id, event, ctx)" />
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
import { inject, computed, ref, nextTick } from "vue";
import { ASSET_EDITOR_PROVIDE_KEY } from "@/constants/constants";
import invariant from "tiny-invariant";

const props = defineProps<{
  widgetDef: Type.TagListWidgetDef;
  widgetContents: Type.WithId<Type.TagListWidgetContent>[];
  isOpen: boolean;
}>();

const tagInput = ref("");

const parentAssetEditor = inject(ASSET_EDITOR_PROVIDE_KEY);

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

interface KeydownContext {
  searchTerm: string;
  highlightedSuggestion: string | null;
  modelValue: string;
}

function handleKeydown(
  itemId: string,
  event: KeyboardEvent,
  ctx: KeydownContext
) {
  if (event.key === ",") {
    // add tag on comma
    event.preventDefault();
    handleTagUpdate(itemId, ctx.searchTerm);
    return;
  }
}
</script>

<style scoped></style>
