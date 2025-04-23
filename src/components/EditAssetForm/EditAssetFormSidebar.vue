<template>
  <div class="flex flex-col gap-6 sticky top-20 p-4">
    <div class="grid grid-cols-2 gap-4 order-last md:order-1 mb-16 md:mb-0">
      <Button :to="`/asset/viewAsset/${asset.assetId}`" target="_blank">
        View
      </Button>

      <Button
        variant="primary"
        type="submit"
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
</template>
<script setup lang="ts">
import { computed } from "vue";
import { useInstanceStore } from "@/stores/instanceStore";
import Button from "@/components/Button/Button.vue";
import { Asset, UnsavedAsset, Template } from "@/types";
import SelectGroup from "@/components/SelectGroup/SelectGroup.vue";
import { MutationStatus } from "@tanstack/vue-query";
import { SpinnerIcon } from "@/icons";
import { CheckCircle2Icon, TriangleAlert } from "lucide-vue-next";

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
<style scoped></style>
