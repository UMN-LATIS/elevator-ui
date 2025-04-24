<template>
  <div class="flex flex-col gap-6 sticky top-20 p-4">
    <div class="grid grid-cols-2 gap-4 order-last md:order-1 mb-16 md:mb-0">
      <Button :to="`/asset/viewAsset/${asset.assetId}`" target="_blank">
        View
      </Button>

      <Button
        variant="primary"
        type="submit"
        class="disabled:!border-black/10 border-groove disabled:cursor-not-allowed"
        :disabled="!canSave"
        @click="$emit('save')">
        Save
        <SpinnerIcon
          v-if="saveStatus === 'pending'"
          class="size-4 animate-spin" />
        <TriangleAlert v-else-if="saveStatus === 'error'" class="size-4" />
        <CheckCircle2Icon v-else-if="saveStatus === 'success'" class="size-4" />
      </Button>
    </div>
    <div class="flex flex-col gap-6 order-1 md:order-2">
      <SelectGroup
        :selectClass="{
          '!bg-green-600 !text-white select-picker-light':
            asset.readyForDisplay,
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
      <!-- <InputGroup
        :modelValue="String(asset.availableAfter?.date ?? '')"
        label="Available After"
        type="datetime-local" /> -->
      <SelectGroup
        :modelValue="String(template.templateId)"
        :options="templateOptions"
        label="Template"
        required
        @update:modelValue="$emit('update:templateId', $event)" />
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
</template>
<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useInstanceStore } from "@/stores/instanceStore";
import Button from "@/components/Button/Button.vue";
import { Asset, UnsavedAsset, Template, PHPDateTime } from "@/types";
import SelectGroup from "@/components/SelectGroup/SelectGroup.vue";
import { MutationStatus } from "@tanstack/vue-query";
import { SpinnerIcon } from "@/icons";
import { CheckCircle2Icon, TriangleAlert } from "lucide-vue-next";
import InputGroup from "../InputGroup/InputGroup.vue";

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
  (e: "update:templateId", templateId: string): void;
  (e: "update:asset", asset: Asset | UnsavedAsset): void;
}>();

const canSave = computed(
  () =>
    props.isValid && props.hasUnsavedChanges && props.saveStatus !== "pending"
);

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
</script>
<style>
.select-picker-light {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23ffffff' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
}
</style>
