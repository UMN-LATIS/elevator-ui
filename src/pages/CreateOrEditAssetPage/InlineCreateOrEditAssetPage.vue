<template>
  <div
    class="inline-edit-asset-page bg-surface px-4 pb-4 rounded-md border border-outline-variant">
    <div
      v-if="depthExceeded"
      class="text-on-surface-variant italic p-2 bg-surface-container rounded text-sm">
      Maximum nesting depth reached.
    </div>
    <DeletedAssetNotice
      v-else-if="deletedAssetInfo"
      :assetId="props.assetId!"
      :deletedAt="deletedAssetInfo.deletedAt"
      @restored="handleRestored" />
    <Transition v-else name="fade">
      <div v-if="assetEditor.loadError" class="p-4 text-sm text-error">
        This related asset could not be loaded.
      </div>
      <div
        v-else-if="!assetEditor.localAsset || !assetEditor.template"
        class="flex justify-center items-center py-12">
        <SpinnerIcon class="w-8 h-8 animate-spin" />
        <span class="ml-2">Loading...</span>
      </div>
      <section v-else class="max-w-screen-xl w-full mx-auto">
        <div class="flex flex-col">
          <div
            class="flex items-center justify-between gap-2 border-b border-outline">
            <h3
              class="text-xs uppercase font-bold text-on-surface-variant mr-auto px-1">
              {{ assetEditor.template.templateName }}
            </h3>
            <div>
              <Button
                v-if="openWidgets.size === 0"
                variant="tertiary"
                @click="handleExpandAll">
                <ChevronsUpDownIcon class="w-4 h-4" />
                <span class="sr-only">Expand</span>
              </Button>
              <Button v-else variant="tertiary" @click="handleCollapseAll">
                <ChevronsDownUpIcon class="w-4 h-4" />
                <span class="sr-only">Collapse</span>
              </Button>
            </div>
          </div>
          <EditWidget
            v-for="{
              widgetDef,
              widgetContents,
              widgetInstanceId,
            } in widgetInstances"
            :key="widgetInstanceId"
            :widgetDef="widgetDef"
            :widgetContents="widgetContents"
            :assetId="assetEditor.localAsset.assetId"
            :collectionId="assetEditor.localAsset.collectionId"
            :isOpen="
              openWidgets.has(
                assetEditor.getWidgetInstanceId(widgetDef.widgetId)
              )
            "
            class="inline-related-asset-widget"
            @save="handleSaveAsset"
            @update:isOpen="
              (open) => {
                open
                  ? openWidgets.add(widgetInstanceId)
                  : openWidgets.delete(widgetInstanceId);
              }
            "
            @update:widgetContents="
              (updatedContents) =>
                assetEditor.updateWidgetContents(
                  widgetDef.fieldTitle,
                  updatedContents
                )
            " />
        </div>
      </section>
    </Transition>
  </div>
</template>
<script setup lang="ts">
import * as T from "@/types";
import {
  computed,
  inject,
  onMounted,
  onUnmounted,
  provide,
  reactive,
  ref,
} from "vue";
import SpinnerIcon from "@/icons/SpinnerIcon.vue";
import { useAssetEditor } from "./useAssetEditor/useAssetEditor";
import { provideAssetEditor } from "./useAssetEditor/provideAssetEditor";
import DeletedAssetNotice from "@/pages/AssetViewPage/DeletedAssetNotice.vue";
import { ApiError } from "@/api/ApiError";
import type { DeletedAssetInfo } from "@/types";
import invariant from "tiny-invariant";
import EditWidget from "./EditWidget/EditWidget.vue";
import Button from "@/components/Button/Button.vue";
import { ChevronsDownUpIcon, ChevronsUpDownIcon } from "lucide-vue-next";
import { hasWidgetContent } from "@/helpers/hasWidgetContent";
import { useToastStore } from "@/stores/toastStore";
import { getErrorMessage } from "@/api/getErrorMessage";

// Depth tracking to prevent infinite recursion with self-referencing templates
const INLINE_DEPTH_KEY = "inlineAssetEditorDepth";
const MAX_DEPTH = 3;
const currentDepth = inject<number>(INLINE_DEPTH_KEY, 0);
const depthExceeded = currentDepth >= MAX_DEPTH;
provide(INLINE_DEPTH_KEY, currentDepth + 1);

const props = withDefaults(
  defineProps<{
    templateId?: number | null;
    collectionId?: number | null;
    assetId?: string | null;
  }>(),
  {
    templateId: null,
    collectionId: null,
    assetId: null,
  }
);

const emit = defineEmits<{
  (e: "update:assetId", assetId: T.Asset["assetId"]): void;
}>();

// the enclosing page's editor, which saves this one along with itself.
// inject only reads the ancestor chain, never a component's own provide,
// so this is the parent editor even though this component provides its
// own editor below.
const parentAssetEditor = useAssetEditor();

const toastStore = useToastStore();

// unique editor instance for this inline asset. When the server creates
// the child, the reducer's command hands the id up so the parent's related
// asset content can point at it.
const assetEditor = provideAssetEditor({
  onAssetCreated: (assetId) => emit("update:assetId", assetId),
});

if (!depthExceeded) {
  const unregister = parentAssetEditor.registerChildEditor({
    // an untouched draft reads as clean, so a never-filled child is not
    // created, while an existing child blanked out by the user still has
    // its deletion to save
    hasUnsavedChanges: () => assetEditor.hasUnsavedChanges,
    save: handleSaveAsset,
  });
  onUnmounted(unregister);
}

const deletedAssetInfo = ref<DeletedAssetInfo | null>(null);

function handleRestored() {
  deletedAssetInfo.value = null;
  if (props.assetId) {
    assetEditor.initExistingAsset(props.assetId, { force: true });
  }
}

onMounted(async () => {
  // Bail out early if depth limit exceeded to prevent infinite recursion
  if (depthExceeded) {
    return;
  }

  if (props.assetId) {
    try {
      await assetEditor.initExistingAsset(props.assetId);
    } catch (err) {
      if (err instanceof ApiError && err.statusCode === 410) {
        deletedAssetInfo.value = err.data as DeletedAssetInfo;
        return;
      }
      throw err;
    }
  } else {
    invariant(props.templateId && props.collectionId);
    await assetEditor.initNewAsset({
      templateId: props.templateId,
      collectionId: props.collectionId,
    });
  }

  // start expanded
  openRequiredOrFilledWidgets();
});

const openWidgets = reactive(new Set<T.WidgetInstanceId>());

const widgetInstances = computed(
  (): Array<{
    widgetInstanceId: T.WidgetInstanceId;
    widgetDef: T.WidgetDef;
    widgetContents: T.WidgetContent[];
  }> => {
    if (!assetEditor.isEditingAsset) {
      return [];
    }
    invariant(
      assetEditor.template,
      "Template must be defined after initialization"
    );

    return assetEditor.template.widgetArray.map((widgetDef) => {
      invariant(
        assetEditor.localAsset,
        "Local asset must be defined after initialization"
      );
      return {
        widgetInstanceId: assetEditor.getWidgetInstanceId(widgetDef.widgetId),
        widgetDef,
        widgetContents: (assetEditor.localAsset[widgetDef.fieldTitle] ??
          []) as T.WidgetContent[],
      };
    });
  }
);

const allWidgetIds = computed(() =>
  widgetInstances.value.map((w) => w.widgetInstanceId)
);

function handleExpandAll() {
  allWidgetIds.value.forEach((widgetId) => openWidgets.add(widgetId));
}

function openRequiredOrFilledWidgets() {
  widgetInstances.value.forEach(
    ({ widgetDef, widgetContents, widgetInstanceId }) => {
      if (
        widgetDef.required ||
        hasWidgetContent(widgetContents, widgetDef.type)
      ) {
        return openWidgets.add(widgetInstanceId);
      }
    }
  );
}

function handleCollapseAll() {
  openWidgets.clear();
}

async function handleSaveAsset() {
  const isExistingAsset = Boolean(props.assetId);
  try {
    await assetEditor.saveAsset();
  } catch (cause) {
    // the parent's save carries on without this child, and its redirect
    // clears the error modal the request already raised, so say here which
    // asset was lost
    toastStore.addToast({
      title: "Error",
      message: `Failed to save inline asset: ${getErrorMessage(cause)}`,
      variant: "error",
    });
    return;
  }

  // if this is an existing asset, we're done
  if (isExistingAsset) return;

  if (!assetEditor.localAsset?.assetId) {
    // this editor took in a different asset while the save was in flight, so
    // the reducer dropped the new id. The asset exists with nothing pointing
    // at it, which the user needs to hear about.
    toastStore.addToast({
      title: "Error",
      message:
        "The inline asset was saved but could not be linked to this asset.",
      variant: "error",
    });
  }
}
</script>
<style>
.inline-edit-asset-page {
  & .edit-widget-layout {
    /* overridde the default styles for widget layout which
    will try to use multiple columns thinkng this is a full page.
    CSS container queries would be good here too. */
    @apply lg:grid-cols-1;
  }

  & .edit-widget-layout__accordion-button-wrapper {
    /* this undoes the 5rem sticky top applied to
  the edit widget layout component when not inlined */
    top: 0 !important;
    width: auto;
  }

  .widget-status-icons {
    /* align with accordion button icon */
    padding-right: 0.5rem;
  }
}
</style>
