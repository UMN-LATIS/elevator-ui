<template>
  <div
    class="md:grid md:grid-cols-[minmax(0,1fr),minmax(auto,20rem)] relative min-h-screen">
    <section class="p-4 max-w-screen-xl w-full mx-auto">
      <AssetSummary :asset="asset" :template="template" class="mb-4" />
      <div class="flex flex-col">
        <div
          class="flex items-center justify-start gap-2 border-b border-neutral-300 pb-2">
          <Button variant="tertiary" @click="handleExpandAll">
            Expand All
          </Button>
          <Button variant="tertiary" @click="handleCollapseAll">
            Collapse All
          </Button>
        </div>
        <EditWidget
          v-for="{ widgetDef, widgetContents } in widgetDefAndContents"
          :key="widgetDef.widgetId"
          :widgetDef="widgetDef"
          :widgetContents="widgetContents"
          :assetId="asset.assetId"
          :collectionId="(asset.collectionId as number)"
          :isOpen="openWidgets.has(widgetDef.widgetId)"
          @save="$emit('save')"
          @update:isOpen="
            (open) => {
              open
                ? openWidgets.add(widgetDef.widgetId)
                : openWidgets.delete(widgetDef.widgetId);
            }
          "
          @update:widgetContents="
            $emit('update:asset', { ...asset, [widgetDef.fieldTitle]: $event })
          " />
      </div>
    </section>
    <aside class="sidebar-container">
      <EditAssetFormSidebar
        :template="template"
        :asset="asset"
        :saveStatus="saveStatus"
        :hasUnsavedChanges="hasUnsavedChanges"
        :isValid="isValid"
        @save="$emit('save')"
        @cancel="$emit('cancel')"
        @update:templateId="$emit('update:templateId', Number.parseInt($event))"
        @migrateCollection="$emit('migrateCollection', $event)"
        @update:asset="$emit('update:asset', $event)" />
    </aside>
  </div>
</template>
<script setup lang="ts">
import { computed, onMounted, reactive } from "vue";
import EditWidget from "../EditWidget/EditWidget.vue";
import Button from "@/components/Button/Button.vue";
import AssetSummary from "./AssetSummary.vue";
import {
  Asset,
  UnsavedAsset,
  Template,
  WidgetContent,
  WidgetDef,
} from "@/types";
import { MutationStatus } from "@tanstack/vue-query";
import EditAssetFormSidebar from "./EditAssetFormSidebar.vue";

const props = defineProps<{
  template: Template;
  asset: Asset | UnsavedAsset;
  saveStatus: MutationStatus;
  hasUnsavedChanges: boolean;
  isValid: boolean;
}>();

defineEmits<{
  (e: "save"): void;
  (e: "cancel"): void;
  (e: "update:templateId", templateId: number): void;
  (e: "migrateCollection", collectionId: number): void;
  (e: "update:asset", asset: Asset | UnsavedAsset): void;
}>();

const openWidgets = reactive(new Set<WidgetDef["widgetId"]>());

// start with all widgets open
onMounted(() => handleExpandAll());

const widgetDefAndContents = computed(
  (): Array<{
    widgetDef: WidgetDef;
    widgetContents: WidgetContent[];
  }> =>
    props.template.widgetArray.map((widgetDef) => ({
      widgetDef,
      widgetContents: (props.asset[widgetDef.fieldTitle] ??
        []) as WidgetContent[],
    }))
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
</script>
<style scoped>
@media (min-width: 768px) {
  .sidebar-container {
    border-left: var(--app-borderWidth) solid var(--app-borderColor);
    background: var(--app-sidebar-backgroundColor);
    color: var(--app-sidebar-textColor);
  }
}
</style>
