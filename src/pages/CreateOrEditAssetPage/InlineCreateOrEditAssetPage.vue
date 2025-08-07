<template>
  <div ref="containerRef" class="inline-edit-asset-page bg-black/5">
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
import {
  computed,
  nextTick,
  onMounted,
  onUnmounted,
  reactive,
  useTemplateRef,
  watch,
} from "vue";
import { RelatedAssetSaveMessage } from "@/types";
import { useRoute, useRouter } from "vue-router";
import { SAVE_RELATED_ASSET_TYPE } from "@/constants/constants";
import SpinnerIcon from "@/icons/SpinnerIcon.vue";
import { useAssetEditor } from "./useAssetEditor/useAssetEditor";
import invariant from "tiny-invariant";
import EditWidget from "./EditWidget/EditWidget.vue";
import Button from "@/components/Button/Button.vue";
import * as Penpal from "penpal";
import { ChevronsDownUpIcon, ChevronsUpDownIcon } from "lucide-vue-next";

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

// Use the asset editor composable
const assetEditor = useAssetEditor();

watch(
  () => props.assetId,
  () => {
    invariant(
      props.assetId || (props.templateId && props.collectionId),
      "Inline related assets require either an assetId (editing) or a templateId and collectionId (creating)"
    );

    if (props.assetId) {
      assetEditor.initExistingAsset(props.assetId);
      return;
    }

    invariant(
      props.templateId && props.collectionId,
      "When creating a new asset, templateId and collectionId must be provided"
    );

    assetEditor.initNewAsset({
      templateId: props.templateId,
      collectionId: props.collectionId,
    });
  },
  { immediate: true }
);

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

function handleCollapseAll() {
  openWidgets.clear();
}

const route = useRoute();
const router = useRouter();
const channelName = computed(() => route.query.channelName as string);

async function handleSaveAsset() {
  const isNewAsset = !props.assetId;
  await assetEditor.saveAsset();

  invariant(
    assetEditor.localAsset?.assetId,
    "Local asset id must be defined after saving"
  );
  const savedAssetId = assetEditor.localAsset.assetId;

  // if this is an existing asset, we're done
  if (!isNewAsset) {
    return;
  }

  // if we're creating a related asset, notify the parent
  if (channelName.value) {
    const channel = new BroadcastChannel(channelName.value);
    const message: RelatedAssetSaveMessage = {
      type: SAVE_RELATED_ASSET_TYPE,
      payload: {
        relatedAssetId: savedAssetId,
      },
    };
    channel.postMessage(message);
    channel.close();
  }

  // redirect to the edit asset page (so that we don't keep recreating
  // new assets on each save!)
  await nextTick();
  router.replace({
    name: "editAsset",
    params: {
      assetId: savedAssetId,
    },
  });
}

// Set up Penpal connection to communicate with parent iframe container
let parentConnection: T.InlineRelatedAssetParentMethods | null = null;

// Set up ResizeObserver to monitor content height changes
const resizeObserver = new ResizeObserver(() => {
  const docHeight = containerRef.value?.clientHeight ?? 0;

  if (!parentConnection) {
    console.warn("[IFRAME] No parent connection to update height");
    return;
  }

  parentConnection.updateHeight(docHeight);
});

const containerRef = useTemplateRef<HTMLDivElement>("containerRef");

watch(
  () => assetEditor.hasAssetChanged,
  (hasChanged) => {
    if (!parentConnection) return;
    parentConnection.updateHasRelatedAssetChanged(hasChanged);
  }
);

onMounted(async () => {
  invariant(containerRef.value, "containerRef must be defined");

  console.log("[IFRAME] InlineEditAssetPage mounted");

  // Connect to parent using Penpal
  try {
    const messenger = new Penpal.WindowMessenger({
      remoteWindow: window.parent,
      allowedOrigins: ["*"], // Allow any origin for now
    });

    const childMethods: T.InlineRelatedAssetChildMethods = {
      async saveAsset(): Promise<T.Asset["assetId"]> {
        console.log("[IFRAME] Saving asset from child");
        await handleSaveAsset();
        return assetEditor.localAsset?.assetId ?? "";
      },
    };

    parentConnection = await Penpal.connect<T.InlineRelatedAssetParentMethods>({
      messenger,
      methods: childMethods,
    }).promise;

    // Start observing height changes after connection is established
    resizeObserver.observe(containerRef.value);

    // Send initial height
    const initialHeight = containerRef.value.clientHeight;
    parentConnection.updateHeight(initialHeight);
  } catch (error) {
    console.warn("Failed to connect to parent via Penpal:", error);
  }
});

onUnmounted(() => {
  resizeObserver?.disconnect();
  parentConnection = null;
});
</script>
<style>
.inline-edit-asset-page {
  & .edit-widget-layout__accordion-button-wrapper {
    /* this undoes the 5rem sticky top applied to
  the edit widget layout component when not inlined */
    top: 0 !important;
  }

  .widget-status-icons {
    /* align with accordion button icon */
    padding-right: 0.5rem;
  }
}
</style>
