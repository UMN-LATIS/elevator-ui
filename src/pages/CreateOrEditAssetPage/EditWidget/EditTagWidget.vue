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
        $event as Type.WithUuid<Type.TagListWidgetContent>[]
      )
    ">
    <template #fieldContents="{ item }">
      <TagsInput
        :modelValue="(item.tags as string[])"
        :addOnBlur="false"
        :addOnPaste="true"
        class="tags-input !py-0"
        @update:modelValue="(tags) => handleUpdateTags(item.uuid, tags as string[])">
        <TagsInputItem
          v-for="tag in item.tags"
          :key="tag"
          :value="tag"
          class="bg-secondary-container text-on-secondary-container h-auto"
          data-testid="tag-item">
          <TagsInputItemText />
          <TagsInputItemDelete />
        </TagsInputItem>

        <FieldAutoComplete
          v-if="widgetDef.attemptAutocomplete"
          :id="`edit-tag-widget-autocomplete-${item.uuid}`"
          :modelValue="pendingTextOf(item)"
          :placeholder="`${widgetDef.label}...`"
          :fieldTitle="widgetDef.fieldTitle"
          :templateId="templateId"
          inputClass="!py-0 flex-1 min-w-24"
          :blurOnSelect="false"
          @update:modelValue="(text) => handlePendingTextInput(item.uuid, text)"
          @blur="commitPendingTag(item.uuid)"
          @select="(selection) => commitTag(item.uuid, selection)"
          @keydown="(event) => handleKeydown(item.uuid, event)" />
        <input
          v-else
          :value="pendingTextOf(item)"
          :placeholder="`${widgetDef.label}...`"
          class="flex-1 min-w-24 bg-transparent text-sm focus:outline-none"
          @input="
            handlePendingTextInput(
              item.uuid,
              ($event.target as HTMLInputElement).value
            )
          "
          @blur="commitPendingTag(item.uuid)"
          @keydown="(event) => handleKeydown(item.uuid, event)" />
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
} from "@/components/ui/tags-input";
import FieldAutoComplete from "@/components/AutoCompleteInput/FieldAutoComplete.vue";
import { computed } from "vue";
import { useAssetEditor } from "../useAssetEditor/useAssetEditor";
import invariant from "tiny-invariant";

const props = defineProps<{
  widgetDef: Type.TagListWidgetDef;
  widgetContents: Type.WithUuid<Type.TagListWidgetContent>[];
  isOpen: boolean;
}>();

const assetEditor = useAssetEditor();

const templateId = computed(() => {
  invariant(assetEditor, "Parent asset editor is required");
  return assetEditor.templateId;
});

const emit = defineEmits<{
  (
    e: "update:widgetContents",
    widgetContents: Type.WithUuid<Type.TagListWidgetContent>[]
  ): void;
  (e: "update:isOpen", isOpen: boolean): void;
}>();

// Tag text being typed lives on its own row in the model, not in this
// component, so every row has its own input, dirtiness sees the text, and
// a save folds it into the tags no matter where focus was.
const pendingTextOf = (item: Type.TagListWidgetContent): string =>
  item.pendingText ?? "";

const rowOf = (itemUuid: string): Type.WithUuid<Type.TagListWidgetContent> => {
  const row = props.widgetContents.find((content) => content.uuid === itemUuid);
  invariant(row, `no tag row with id ${itemUuid}`);
  return row;
};

const handleAdd = () =>
  emit(
    "update:widgetContents",
    ops.makeAddContentPayload(props.widgetContents, props.widgetDef)
  );

const handleSetPrimary = (uuid: string) =>
  emit(
    "update:widgetContents",
    ops.makeSetPrimaryContentPayload(props.widgetContents, uuid)
  );

const handleDelete = (uuid: string) =>
  emit(
    "update:widgetContents",
    ops.deleteWidgetContent(props.widgetContents, uuid)
  );

const handleUpdateTags = (
  itemUuid: string,
  tags: Type.TagListWidgetContent["tags"]
) => {
  emit(
    "update:widgetContents",
    ops.makeUpdateContentPayload(props.widgetContents, itemUuid, tags, "tags")
  );
};

const handlePendingTextInput = (itemUuid: string, text: string) => {
  emit(
    "update:widgetContents",
    ops.makeUpdateContentPayload(
      props.widgetContents,
      itemUuid,
      text,
      "pendingText"
    )
  );
};

/** Commit whatever tag text the row's input holds. */
function commitPendingTag(itemUuid: string) {
  commitTag(itemUuid, pendingTextOf(rowOf(itemUuid)));
}

/** Turn `value` into a committed tag on the row and clear its input. */
function commitTag(itemUuid: string, value: string) {
  const row = rowOf(itemUuid);
  const tag = value.trim();
  const tags = row.tags ?? [];

  const shouldAddTag = tag !== "" && !tags.includes(tag);
  const nextTags = shouldAddTag ? [...tags, tag] : tags;
  const nextContents = props.widgetContents.map((content) =>
    content.uuid === itemUuid
      ? { ...content, tags: nextTags, pendingText: "" }
      : content
  );
  emit("update:widgetContents", nextContents);
}

function removeLastTag(itemUuid: string) {
  const tags = rowOf(itemUuid).tags ?? [];
  emit(
    "update:widgetContents",
    ops.makeUpdateContentPayload(
      props.widgetContents,
      itemUuid,
      tags.slice(0, -1),
      "tags"
    )
  );
}

function handleKeydown(itemUuid: string, event: KeyboardEvent) {
  if (event.key === "," || event.key === "Enter") {
    event.preventDefault();
    commitPendingTag(itemUuid);
    return;
  }

  // Tab commits a pending tag, and moves focus on as usual otherwise
  if (event.key === "Tab" && pendingTextOf(rowOf(itemUuid)).trim()) {
    event.preventDefault();
    commitPendingTag(itemUuid);
    return;
  }

  // delete the previous tag on backspace if the input is empty
  if (event.key === "Backspace" && pendingTextOf(rowOf(itemUuid)) === "") {
    event.preventDefault();
    removeLastTag(itemUuid);
  }
}
</script>
