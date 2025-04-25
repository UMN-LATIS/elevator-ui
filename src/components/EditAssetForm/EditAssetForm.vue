<template>
  <div class="md:grid md:grid-cols-[minmax(0,1fr),auto] relative min-h-screen">
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
          :isOpen="openWidgets.has(widgetDef.widgetId)"
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
    <aside class="md:bg-neutral-200 md:border-l-2 border-neutral-900">
      <EditAssetFormSidebar
        :template="template"
        :asset="asset"
        :saveStatus="saveStatus"
        :hasUnsavedChanges="hasUnsavedChanges"
        :isValid="isValid"
        @save="$emit('save')"
        @cancel="$emit('cancel')"
        @update:templateId="$emit('update:templateId', Number.parseInt($event))"
        @update:asset="$emit('update:asset', $event)" />
    </aside>
  </div>
</template>
<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import EditWidget from "@/components/EditAssetForm/EditWidget/EditWidget.vue";
import Button from "@/components/Button/Button.vue";
import AssetSummary from "./AssetSummary.vue";
import {
  Asset,
  UnsavedAsset,
  Template,
  WidgetContent,
  WidgetProps,
  TemplateComparison,
} from "@/types";
import { MutationStatus } from "@tanstack/vue-query";
import EditAssetFormSidebar from "./EditAssetFormSidebar.vue";
import ConfirmModal from "../ConfirmModal/ConfirmModal.vue";
import invariant from "tiny-invariant";

const props = defineProps<{
  template: Template;
  asset: Asset | UnsavedAsset;
  saveStatus: MutationStatus;
  hasUnsavedChanges: boolean;
  isValid: boolean;
}>();

const emit = defineEmits<{
  (e: "save"): void;
  (e: "cancel"): void;
  (e: "update:templateId", templateId: number): void;
  (e: "update:asset", asset: Asset | UnsavedAsset): void;
}>();

const maybeNewTemplateId = ref<number | null>();
const templateComparison = ref<TemplateComparison | null>(null);
const isConfirmingTemplateChange = computed(() => {
  return !!templateComparison.value;
});
const openWidgets = reactive(new Set<WidgetProps["widgetId"]>());

const widgetDefAndContents = computed(
  (): Array<{
    widgetDef: WidgetProps;
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

function handleConfirmTemplateChange() {
  invariant(
    maybeNewTemplateId.value,
    "maybeNewTemplateId should be set when confirming template change"
  );
  emit("update:templateId", maybeNewTemplateId.value);
  templateComparison.value = null;
  maybeNewTemplateId.value = null;
}

function handleCancelTemplateChange() {
  templateComparison.value = null;
  maybeNewTemplateId.value = null;
}
</script>
<style scoped></style>
