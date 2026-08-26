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
              sessionWidgetId,
            } in sessionWidgets"
            :key="sessionWidgetId"
            :widgetDef="widgetDef"
            :widgetContents="widgetContents"
            :assetId="assetEditor.localAsset.assetId"
            :collectionId="assetEditor.localAsset.collectionId"
            :isOpen="
              openWidgets.has(
                assetEditor.getSessionWidgetId(widgetDef.widgetId)
              )
            "
            class="inline-related-asset-widget"
            @update:isOpen="
              (open) => {
                open
                  ? openWidgets.add(sessionWidgetId)
                  : openWidgets.delete(sessionWidgetId);
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
import type { SessionWidgetId } from "./useAssetEditor/types";
import { computed, inject, onMounted, provide, reactive, ref } from "vue";
import SpinnerIcon from "@/icons/SpinnerIcon.vue";
import {
  provideAssetEditor,
  useAssetEditor,
} from "./useAssetEditor/useAssetEditor";
import DeletedAssetNotice from "@/pages/AssetViewPage/DeletedAssetNotice.vue";
import { ApiError } from "@/api/ApiError";
import type { DeletedAssetInfo } from "@/types";
import invariant from "tiny-invariant";
import EditWidget from "./EditWidget/EditWidget.vue";
import Button from "@/components/Button/Button.vue";
import { ChevronsDownUpIcon, ChevronsUpDownIcon } from "lucide-vue-next";
import { hasWidgetContent } from "@/helpers/hasWidgetContent";

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
    /** the parent's related-asset field this inline asset lives in */
    fieldTitle: string;
    /** the parent's item whose targetAssetId this asset's create fills in */
    itemUuid: string;
  }>(),
  {
    templateId: null,
    collectionId: null,
    assetId: null,
  }
);

// inject only reads the ancestor chain, never a component's own provide,
// so this is the parent surface's editor even though this component
// provides its own on the same shared editor context
const parentAssetEditor = useAssetEditor();

// this surface's own editor on the page's shared state. The parent link
// names the item this child is mounted under, so when the server creates
// the child, the reducer stamps the new id onto that item in the same
// transition. The parent's save walks the state's parent links, so no
// registration is needed for it to see this child.
invariant(
  parentAssetEditor.editSessionKey,
  "an inline related asset requires an open parent editor"
);
const assetEditor = provideAssetEditor({
  role: "child",
  parentLink: {
    key: parentAssetEditor.editSessionKey,
    fieldTitle: props.fieldTitle,
    itemUuid: props.itemUuid,
  },
});

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
      // 410 is a deleted asset, which has its own notice. Any other
      // failure is already on the editor's state as loadError and renders
      // in place, so rethrowing would hand the same error to the
      // ErrorBoundary, which replaces the page instead of showing it.
      if (err instanceof ApiError && err.statusCode === 410) {
        deletedAssetInfo.value = err.data as DeletedAssetInfo;
        return;
      }
      console.error("Error loading related asset:", err);
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

const openWidgets = reactive(new Set<SessionWidgetId>());

const sessionWidgets = computed(
  (): Array<{
    sessionWidgetId: SessionWidgetId;
    widgetDef: T.WidgetDef;
    widgetContents: T.WidgetContent[];
  }> => {
    if (!assetEditor.hasAssetToEdit) {
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
        sessionWidgetId: assetEditor.getSessionWidgetId(widgetDef.widgetId),
        widgetDef,
        widgetContents: (assetEditor.localAsset[widgetDef.fieldTitle] ??
          []) as T.WidgetContent[],
      };
    });
  }
);

const allSessionWidgetIds = computed(() =>
  sessionWidgets.value.map((w) => w.sessionWidgetId)
);

function handleExpandAll() {
  allSessionWidgetIds.value.forEach((id) => openWidgets.add(id));
}

function openRequiredOrFilledWidgets() {
  sessionWidgets.value.forEach(
    ({ widgetDef, widgetContents, sessionWidgetId }) => {
      if (
        widgetDef.required ||
        hasWidgetContent(widgetContents, widgetDef.type)
      ) {
        return openWidgets.add(sessionWidgetId);
      }
    }
  );
}

function handleCollapseAll() {
  openWidgets.clear();
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
