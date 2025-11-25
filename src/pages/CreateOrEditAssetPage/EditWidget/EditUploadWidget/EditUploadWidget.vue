<template>
  <EditWidgetLayout
    :widgetContents="widgetContents"
    :widgetDef="widgetDef"
    class="edit-upload-widget"
    :isOpen="isOpen"
    @update:isOpen="$emit('update:isOpen', $event)"
    @setPrimary="
      (id) =>
        $emit(
          'update:widgetContents',
          ops.makeSetPrimaryContentPayload(widgetContents, id)
        )
    "
    @delete="
      (id) => {
        handleDeleteContent(id);
      }
    "
    @update:widgetContents="
      (widgetContents) => {
        $emit('update:widgetContents', widgetContents as Type.WithId<Type.UploadWidgetContent>[]);
      }
    ">
    <template #moreWidgetActions>
      <DropDown :showChevron="false">
        <template #label>
          <span class="sr-only">Toggle More Actions Menu</span>
          <VerticalDotsIcon class="w-5 h-5" />
        </template>
        <DropDownItem is="div">
          <button
            class="w-full flex items-center gap-2"
            @click="handleRegenerateAllDerivatives">
            <CircleFilledCheckIcon
              v-if="isRegeneratingAllDerivatives"
              class="size-4" />
            <Circle v-else class="size-4" />
            Regenerate All Derivatives
          </button>
        </DropDownItem>
      </DropDown>
    </template>
    <template #fieldContents="{ item }">
      <EditUploadWidgetItem
        :item="item"
        :widgetDef="widgetDef"
        :isShowingDetails="isShowingDetails.has(item.id)"
        class="upload-widget-item"
        @update:item="handleUpdateItem"
        @toggle:details="
          isShowingDetails.has(item.id)
            ? isShowingDetails.delete(item.id)
            : isShowingDetails.add(item.id)
        " />
    </template>
    <template #footer>
      <FileUploader
        v-show="widgetDef.allowMultiple || !hasContents"
        :collectionId="props.collectionId"
        :maxNumberOfFiles="widgetDef.allowMultiple ? undefined : 1"
        @complete="handleCompleteUpload" />
    </template>
  </EditWidgetLayout>
</template>
<script setup lang="ts">
import { computed, nextTick, ref } from "vue";
import * as Type from "@/types";
import EditWidgetLayout from "../EditWidgetLayout.vue";
import * as ops from "../helpers/editWidgetOps";
import FileUploader from "./FileUploader.vue";
import { createDefaultWidgetContent } from "@/helpers/createDefaultWidgetContents";
import api from "@/api";
import EditUploadWidgetItem from "./EditUploadWidgetItem.vue";
import DropDown from "@/components/DropDown/DropDown.vue";
import DropDownItem from "@/components/DropDown/DropDownItem.vue";
import { VerticalDotsIcon } from "@/icons";
import { Circle } from "lucide-vue-next";
import CircleFilledCheckIcon from "@/icons/CircleFilledCheckIcon.vue";
import { useDebounceFn } from "@vueuse/core";

const props = defineProps<{
  collectionId: number;
  widgetDef: Type.UploadWidgetDef;
  widgetContents: Type.WithId<Type.UploadWidgetContent>[];
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (
    e: "update:widgetContents",
    widgetContents: Type.WithId<Type.UploadWidgetContent>[]
  );
  (e: "update:isOpen", isOpen: boolean): void;
  (e: "save"): void;
}>();

const isShowingDetails = ref<Set<string>>(new Set());
const hasContents = computed(() => {
  return props.widgetContents.length > 0;
});

const debouncedEmitSave = useDebounceFn(() => emit("save"), 500, {
  maxWait: 2000,
});

async function handleCompleteUpload(fileRecord: Type.FileUploadRecord) {
  const uploadedItem: Type.WithId<Type.UploadWidgetContent> = {
    ...createDefaultWidgetContent(props.widgetDef),
    fileId: fileRecord.fileObjectId,
    fileDescription: "",
    fileType: fileRecord.contentType,
    loc: null, // server will extract from metadata
    sidecars: {}, // Initialize sidecars as an empty object
    searchData: "", // Initialize searchData as an empty string
  };

  emit("update:widgetContents", [
    ...props.widgetContents,
    uploadedItem,
  ] as Type.WithId<Type.UploadWidgetContent>[]);

  await nextTick();
  debouncedEmitSave();
}

async function handleDeleteContent(id: string) {
  if (
    !confirm(
      "Delete this upload object? This action cannot be undone and will delete the source media and any derivatives."
    )
  ) {
    return;
  }

  const item = props.widgetContents.find((item) => item.id === id);

  if (!item) {
    throw new Error(
      `No upload item found with id: ${id}. Cannot delete non-existent item.`
    );
  }

  // Call the API to delete the file object
  await api.deleteFileObject(item.fileId);

  emit(
    "update:widgetContents",
    ops.deleteWidgetContent(props.widgetContents, id)
  );

  await nextTick();
  debouncedEmitSave();
}

function handleUpdateItem(item: Type.WithId<Type.UploadWidgetContent>) {
  const updatedContents = props.widgetContents.map((existingItem) => {
    if (existingItem.id === item.id) {
      return { ...existingItem, ...item };
    }
    return existingItem;
  });
  emit("update:widgetContents", updatedContents);
}

const isRegeneratingAllDerivatives = computed(() => {
  return props.widgetContents.every(
    (item: Type.WithId<Type.UploadWidgetContent>) => item.regenerate === "On"
  );
});

function handleRegenerateAllDerivatives() {
  const updatedContents = props.widgetContents.map(
    (item: Type.WithId<Type.UploadWidgetContent>) => ({
      ...item,
      // regenerate is not true/false, but "On" or undefined
      regenerate: isRegeneratingAllDerivatives.value
        ? undefined
        : ("On" as const),
    })
  );

  emit("update:widgetContents", updatedContents);

  // also open all details views
  const allIds = props.widgetContents.map((item) => item.id);
  isShowingDetails.value = new Set(allIds);

  // nextTick(() => {
  //   debouncedEmitSave();
  // });
}
</script>
<style scoped></style>
<style></style>
