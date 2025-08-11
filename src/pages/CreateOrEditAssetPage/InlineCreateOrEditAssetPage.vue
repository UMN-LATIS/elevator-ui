<template>
  <div ref="containerRef" class="inline-edit-asset-page">
    <Transition name="fade">
      <div
        v-if="!assetEditor.localAsset || !assetEditor.template"
        class="flex justify-center items-center py-12">
        <SpinnerIcon class="w-8 h-8 animate-spin" />
        <span class="ml-2">Loading...</span>
      </div>
      <section v-else class="max-w-screen-xl w-full mx-auto">
        <div class="flex flex-col">
          <div
            class="flex items-center justify-between gap-2 border-b border-neutral-300">
            <h3
              class="text-xs uppercase font-bold text-neutral-400 mr-auto px-1">
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
            v-for="{ widgetDef, widgetContents } in widgetDefAndContents"
            :key="widgetDef.widgetId"
            :widgetDef="widgetDef"
            :widgetContents="widgetContents"
            :assetId="assetEditor.localAsset.assetId"
            :collectionId="assetEditor.localAsset.collectionId"
            :isOpen="openWidgets.has(widgetDef.widgetId)"
            class="inline-related-asset-widget"
            @save="handleSaveAsset"
            @update:isOpen="
              (open) => {
                open
                  ? openWidgets.add(widgetDef.widgetId)
                  : openWidgets.delete(widgetDef.widgetId);
              }
            "
            @update:widgetContents="
              (updatedContents) =>
                assetEditor.updateAssetField(
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
import { computed, onMounted, reactive, useTemplateRef, watch } from "vue";
import SpinnerIcon from "@/icons/SpinnerIcon.vue";
import { useAssetEditor } from "./useAssetEditor/useAssetEditor";
import invariant from "tiny-invariant";
import EditWidget from "./EditWidget/EditWidget.vue";
import Button from "@/components/Button/Button.vue";
import { ChevronsDownUpIcon, ChevronsUpDownIcon } from "lucide-vue-next";
import { ASSET_EDITOR_PROVIDE_KEY } from "@/constants/constants";
import { inject } from "vue";

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
  (e: "update:relatedAssetDirty", isDirty: boolean): void; // unsaved changes
}>();

// the parent asset component's editor - used to register the `onBeforeSave`
// hook
const parentAssetEditor = inject(ASSET_EDITOR_PROVIDE_KEY);
const assetEditor = useAssetEditor();

onMounted(async () => {
  invariant(parentAssetEditor);

  // register a hook to save the current asset whenever the parent asset is saved
  parentAssetEditor.onBeforeSave(async (): Promise<void> => {
    if (!assetEditor.hasAssetChanged) return;
    return handleSaveAsset();
  });

  if (props.assetId) {
    await assetEditor.initExistingAsset(props.assetId);
  } else {
    invariant(props.templateId && props.collectionId);
    await assetEditor.initNewAsset({
      templateId: props.templateId,
      collectionId: props.collectionId,
    });
  }

  // start expanded
  openWidgetsWithContent();
  return;
});

const openWidgets = reactive(new Set<T.WidgetDef["widgetId"]>());

const widgetDefAndContents = computed(
  (): Array<{
    widgetDef: T.WidgetDef;
    widgetContents: T.WidgetContent[];
  }> => {
    if (!assetEditor.isInitialized) {
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
        widgetDef,
        widgetContents: (assetEditor.localAsset[widgetDef.fieldTitle] ??
          []) as T.WidgetContent[],
      };
    });
  }
);

const allWidgetIds = computed(() =>
  widgetDefAndContents.value.map(({ widgetDef }) => widgetDef.widgetId)
);

function handleExpandAll() {
  allWidgetIds.value.forEach((widgetId) => openWidgets.add(widgetId));
}

function openWidgetsWithContent() {
  assetEditor.widgetIdsWithContent.forEach((widgetId) => {
    if (allWidgetIds.value.includes(widgetId)) {
      openWidgets.add(widgetId);
    }
  });
}

function handleCollapseAll() {
  openWidgets.clear();
}

async function handleSaveAsset() {
  const isExistingAsset = props.assetId;
  await assetEditor.saveAsset();

  invariant(
    assetEditor.localAsset?.assetId,
    "Local asset id must be defined after saving"
  );

  // reset the dirty state now that we've saved
  emit("update:relatedAssetDirty", false);

  // if this is an existing asset, we're done
  if (isExistingAsset) return;

  // redirect to the edit asset page
  const savedAssetId = assetEditor.localAsset.assetId;
  emit("update:assetId", savedAssetId);
}

const containerRef = useTemplateRef<HTMLDivElement>("containerRef");

watch(
  () => assetEditor.hasAssetChanged,
  (hasChanged) => {
    // emit the dirty state to the parent component
    emit("update:relatedAssetDirty", hasChanged);
  }
);
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
