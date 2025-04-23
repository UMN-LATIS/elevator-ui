<template>
  <form
    class="md:grid md:grid-cols-[minmax(0,1fr),auto] relative min-h-screen"
    @submit.prevent="$emit('save')">
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
      <div class="flex flex-col gap-6 sticky top-20 p-4">
        <div class="grid grid-cols-2 gap-4 order-last md:order-1 mb-16 md:mb-0">
          <!-- <Button variant="secondary" @click="$emit('cancel')">Cancel</Button> -->
          <Button :to="`/asset/viewAsset/${asset.assetId}`" target="_blank">
            View
          </Button>

          <Button variant="primary" type="submit" :disabled="!isDirty">
            Save
            <SpinnerIcon
              v-if="saveStatus === 'pending'"
              class="size-4 animate-spin" />
            <TriangleAlert v-else-if="saveStatus === 'error'" class="size-4" />
            <CheckCircle2Icon
              v-else-if="saveStatus === 'success'"
              class="size-4" />
          </Button>
        </div>
        <div class="flex flex-col gap-6 order-1 md:order-2">
          <SelectGroup
            :modelValue="String(template.templateId)"
            :options="templateOptions"
            label="Template"
            required
            @update:templateId="$emit('update:templateId', $event)" />
          <SelectGroup
            :modelValue="String(asset.collectionId)"
            :options="collectionOptions"
            label="Collection"
            required
            @update:modelValue="
              $emit('update:asset', {
                ...asset,
                collectionId: Number.parseInt($event),
              })
            " />
        </div>
      </div>
    </aside>
  </form>
</template>
<script setup lang="ts">
import { computed, reactive } from "vue";
import { useInstanceStore } from "@/stores/instanceStore";
import EditWidget from "@/components/EditAssetForm/EditWidget/EditWidget.vue";
import Button from "@/components/Button/Button.vue";
import AssetSummary from "./AssetSummary.vue";
import {
  Asset,
  UnsavedAsset,
  Template,
  WidgetContent,
  WidgetProps,
} from "@/types";
import SelectGroup from "@/components/SelectGroup/SelectGroup.vue";
import { MutationStatus } from "@tanstack/vue-query";
import { SpinnerIcon } from "@/icons";
import { CheckCircle2Icon, TriangleAlert } from "lucide-vue-next";

const props = defineProps<{
  template: Template;
  asset: Asset | UnsavedAsset;
  saveStatus: MutationStatus;
  isDirty: boolean;
}>();

defineEmits<{
  (e: "save"): void;
  (e: "cancel"): void;
  (e: "update:templateId", templateId: string): void;
  (e: "update:asset", asset: Asset | UnsavedAsset): void;
}>();

const openWidgets = reactive(new Set<WidgetProps["widgetId"]>());

const instanceStore = useInstanceStore();

const templateOptions = computed(() => {
  return (
    instanceStore.instance.templates?.map((template) => ({
      label: template.name,
      id: template.id.toString(),
    })) ?? []
  );
});

const collectionOptions = computed(() => {
  return (
    instanceStore.collections?.map((collection) => ({
      label: collection.title,
      id: collection.id.toString(),
    })) ?? []
  );
});

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
</script>
<style scoped></style>
