<template>
  <div class="flex flex-col gap-6 sticky top-20 p-4">
    <div
      class="grid gap-x-4 gap-y-2 order-last md:order-1 mb-16 md:mb-0"
      :class="{
        'grid-cols-2': asset.assetId,
        'grid-cols-1': !asset.assetId,
      }">
      <Button
        v-if="asset.assetId"
        :to="`/asset/viewAsset/${asset.assetId}`"
        target="_blank">
        View
      </Button>

      <Button
        variant="primary"
        type="submit"
        class="disabled:!border-black/10 border-groove disabled:cursor-not-allowed"
        :disabled="!isValid || saveStatus === 'pending'"
        @click="$emit('save')">
        Save
        <SpinnerIcon
          v-if="saveStatus === 'pending'"
          class="size-4 animate-spin" />
        <TriangleAlert v-else-if="saveStatus === 'error'" class="size-4" />
        <CheckCircle2Icon v-else-if="saveStatus === 'success'" class="size-4" />
      </Button>

      <div class="col-start-1 -col-end-1 text-xs text-right">
        <div
          v-if="!isValid && missingRequiredFields.length > 0"
          class="font-medium mb-1 text-red-600">
          Missing required:
          <span class="italic">
            {{ missingRequiredFields.join(", ") }}
          </span>
        </div>
        <p v-else-if="!hasUnsavedChanges" class="text-neutral-400">
          No unsaved changes
        </p>
      </div>
    </div>
    <div class="flex flex-col gap-6 order-1 md:order-2">
      <SelectGroup
        :selectClass="{
          '!bg-green-600 !text-white select-picker-light':
            !!asset.readyForDisplay,
          'bg-transparent border border-solid border-neutral-900':
            !asset.readyForDisplay,
        }"
        :modelValue="asset.readyForDisplay ? 'ready' : 'draft'"
        :options="[
          {
            id: 'ready',
            label: 'Ready',
          },
          {
            id: 'draft',
            label: 'Not Ready',
          },
        ]"
        label="Status"
        required
        @update:modelValue="
          $emit('update:asset', {
            ...asset,
            readyForDisplay: $event === 'ready',
          })
        " />
      <InputGroup
        v-model="localAvailableAfterDate"
        label="Available After"
        type="date"
        inputClass="text-sm pl-3"
        @update:modelValue="handleUpdateAvailableAfter" />
      <SelectGroup
        :modelValue="displayTemplateId"
        :options="assetEditor.templateOptions"
        label="Template"
        required
        @update:modelValue="handleUpdateTemplateId($event)" />
      <SelectGroup
        v-model="state.localCollectionId"
        :options="assetEditor.collectionOptions"
        label="Collection"
        required
        @update:modelValue="handleUpdateCollectionId($event)" />

      <TableOfContents :items="tocItems" />
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import Button from "@/components/Button/Button.vue";
import {
  Asset,
  UnsavedAsset,
  Template,
  PHPDateTime,
  WidgetDef,
  WidgetContent,
} from "@/types";
import SelectGroup from "@/components/SelectGroup/SelectGroup.vue";
import { MutationStatus } from "@tanstack/vue-query";
import { SpinnerIcon } from "@/icons";
import { CheckCircle2Icon, TriangleAlert } from "lucide-vue-next";
import InputGroup from "@/components/InputGroup/InputGroup.vue";
import TableOfContents, {
  TocItem,
} from "../TableOfContents/TableOfContents.vue";
import { hasWidgetContent } from "@/helpers/hasWidgetContent";
import {
  getMissingRequiredFields,
  phpDateToString,
} from "../useAssetEditor/utils";
import { useAssetEditor } from "../useAssetEditor/useAssetEditor";
import invariant from "tiny-invariant";

const props = defineProps<{
  template: Template;
  asset: Asset | UnsavedAsset;
  saveStatus: MutationStatus;
  hasUnsavedChanges: boolean;
  isValid: boolean;
  selectedTemplateId?: number | null;
}>();

const emit = defineEmits<{
  (e: "save"): void;
  (e: "cancel"): void;
  (e: "update:templateId", templateId: number): void;
  (e: "update:asset", asset: Asset | UnsavedAsset): void;
  (e: "migrateCollection", collectionId: number): void;
}>();

const state = reactive({
  localCollectionId: props.asset.collectionId,
});

// Use controlled value for template ID - either selected or asset's current
const displayTemplateId = computed(
  () => props.selectedTemplateId ?? props.asset.templateId
);

watch(
  () => props.asset.collectionId,
  (newCollectionId) => {
    state.localCollectionId = newCollectionId;
  }
);

const localAvailableAfterDate = ref("");
const assetEditor = useAssetEditor();

const missingRequiredFields = computed(() => {
  return getMissingRequiredFields({
    asset: props.asset,
    template: props.template,
  });
});

function handleUpdateAvailableAfter(value: string | number) {
  if (!value) {
    emit("update:asset", {
      ...props.asset,
      availableAfter: null,
    });
    return;
  }

  emit("update:asset", {
    ...props.asset,
    availableAfter: {
      date: value.toString(),
      timezone_type: 3,
      timezone: "UTC",
    },
  });
}

watch(
  () => props.asset.availableAfter,
  (newValue) => {
    // cast to PHPDateTime to help TS
    const availableAfter = newValue as PHPDateTime | null;

    // if both are falsy, we're done (e.g. null and "" are equivalent)
    if (!availableAfter && !localAvailableAfterDate.value) {
      return;
    }

    // if dates match, we're done
    if (availableAfter?.date === localAvailableAfterDate.value) {
      return;
    }

    // if we're out of sync with the parent, reconcile
    localAvailableAfterDate.value = phpDateToString(availableAfter);
  },
  {
    immediate: true,
    deep: true,
  }
);

const tocItems = computed((): TocItem[] => {
  return props.template.widgetArray
    .toSorted((a, b) => a.templateOrder - b.templateOrder)
    .map((widgetDef: WidgetDef) => {
      const fieldTitle = widgetDef.fieldTitle;
      const widgetContents = props.asset[fieldTitle] as WidgetContent[];

      const tocItem: TocItem = {
        id: `widget-${widgetDef.widgetId}`,
        label: widgetDef.label,
        hasContent: hasWidgetContent(widgetContents, widgetDef.type),
        isRequired: widgetDef.required,
      };

      return tocItem;
    });
});

function handleUpdateTemplateId(templateId: number | string | null) {
  invariant(typeof templateId === "number", "Template ID must be a number");
  emit("update:templateId", templateId);
}

function handleUpdateCollectionId(collectionId: number | string | null) {
  invariant(typeof collectionId === "number", "Collection ID must be a number");
  emit("migrateCollection", collectionId);
}
</script>
<style>
.select-picker-light {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23ffffff' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
}
</style>
