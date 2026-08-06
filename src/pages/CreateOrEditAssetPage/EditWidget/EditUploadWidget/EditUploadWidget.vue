<template>
  <EditWidgetLayout
    :widgetContents="widgetContents"
    :widgetDef="widgetDef"
    class="edit-upload-widget !pt-1"
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
          <VerticalDotsIcon class="size-5" />
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
import { computed, ref, defineAsyncComponent } from "vue";
import * as Type from "@/types";
import EditWidgetLayout from "../EditWidgetLayout.vue";
import * as ops from "../helpers/editWidgetOps";
import { createDefaultWidgetContent } from "@/helpers/createDefaultWidgetContents";
import api from "@/api";
import { useAssetEditor } from "../../useAssetEditor/useAssetEditor";
import { useToastStore } from "@/stores/toastStore";
import { getErrorMessage } from "@/api/getErrorMessage";
import EditUploadWidgetItem from "./EditUploadWidgetItem.vue";
import DropDown from "@/components/DropDown/DropDown.vue";
import DropDownItem from "@/components/DropDown/DropDownItem.vue";
import { VerticalDotsIcon } from "@/icons";
import { Circle } from "lucide-vue-next";
import CircleFilledCheckIcon from "@/icons/CircleFilledCheckIcon.vue";

// Lazy — Uppy + plugins (~300 KB) only load when a curator is actually
// editing an upload widget, not for metadata-only edits.
const FileUploader = defineAsyncComponent(() => import("./FileUploader.vue"));

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

const assetEditor = useAssetEditor();
const toastStore = useToastStore();

/**
 * This widget's rows as the model holds them right now. Props lag by a
 * render, so two uploads completing in the same flush would each read the
 * pre-update array and the second would overwrite the first.
 */
function currentContents(): Type.WithId<Type.UploadWidgetContent>[] {
  return (assetEditor.localAsset?.[props.widgetDef.fieldTitle] ??
    []) as Type.WithId<Type.UploadWidgetContent>[];
}

function handleCompleteUpload(fileRecord: Type.FileUploadRecord) {
  const uploadedItem: Type.WithId<Type.UploadWidgetContent> = {
    ...createDefaultWidgetContent(props.widgetDef),
    fileId: fileRecord.fileObjectId,
    fileDescription: "",
    fileType: fileRecord.contentType,
    loc: null, // server will extract from metadata
    sidecars: {}, // Initialize sidecars as an empty object
    searchData: "", // Initialize searchData as an empty string
  };

  assetEditor.updateWidgetContents(props.widgetDef.fieldTitle, [
    ...currentContents(),
    uploadedItem,
  ]);
  emit("save");
}

async function handleDeleteContent(id: string) {
  if (
    !confirm(
      "Delete this upload object? This action cannot be undone and will delete the source media and any derivatives."
    )
  ) {
    return;
  }

  const item = currentContents().find((item) => item.id === id);

  if (!item) {
    throw new Error(
      `No upload item found with id: ${id}. Cannot delete non-existent item.`
    );
  }

  // save the removal first: if the save fails, the asset must not be left
  // referencing media that is already destroyed. That ordering is why this
  // saves through the editor rather than emitting to the page like a
  // completed upload does, since an emit cannot be awaited.
  assetEditor.updateWidgetContents(
    props.widgetDef.fieldTitle,
    ops.deleteWidgetContent(currentContents(), id)
  );
  try {
    await assetEditor.saveAsset();
  } catch (cause) {
    toastStore.addToast({
      title: "Error",
      message: `The file was not deleted because the asset could not be saved: ${getErrorMessage(cause)}`,
      variant: "error",
    });
    return;
  }

  try {
    await api.deleteFileObject(item.fileId);
  } catch (cause) {
    console.error("Error deleting file object:", cause);
    toastStore.addToast({
      title: "Error",
      message:
        "The file was removed from the asset but could not be deleted from storage.",
      variant: "error",
    });
  }
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
}
</script>
<style scoped></style>
<style>
.edit-upload-widget .dropdown__menu-button {
  padding: 0.25rem;
}

/* hacky fix to slide the tooltip up a bit. The size of the more actions button in the row above pushes it down otherwise, and makes it look like there's too much space between the widget label and the tooltip */
.edit-upload-widget .widget-tooltip {
  position: relative;
  top: -0.5rem;
}
</style>
