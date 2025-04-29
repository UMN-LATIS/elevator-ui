<template>
  <div class="flex flex-col gap-6 sticky top-20 p-4">
    <div
      class="grid gap-4 order-last md:order-1 mb-16 md:mb-0"
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
      <InputGroup
        v-model="localAvailableAfterDate"
        label="Available After"
        type="date"
        inputClass="text-sm pl-3"
        @update:modelValue="handleUpdateAvailableAfter" />
      <SelectGroup
        v-model="state.localTemplateId"
        :options="templateOptions"
        label="Template"
        required
        @update:modelValue="compareTemplatesAndConfirm" />
      <SelectGroup
        v-model="state.localCollectionId"
        :options="collectionOptions"
        label="Collection"
        required
        @update:modelValue="compareCollectionsAndConfirm" />

      <TableOfContents :items="tocItems" />
    </div>
    <Teleport to="body">
      <ConfirmModal
        type="danger"
        :isOpen="state.isConfirmingTemplateChange"
        title="Are you sure?"
        @confirm="handleConfirmTemplateChange"
        @close="handleCancelTemplateChange">
        <p>
          Switching templates may result in the loss of data. The following
          fields are not present in the new template:
        </p>

        <ul v-if="state.templateComparison" class="list-disc list-inside">
          <li
            v-for="(value, key) in (state.templateComparison as TemplateComparison)"
            :key="key">
            {{ value.label }} ({{ value.type }})
          </li>
        </ul>
      </ConfirmModal>

      <ConfirmModal
        type="danger"
        :isOpen="state.isConfirmingMigrateCollection"
        title="Are you sure?"
        @confirm="handleConfirmMigrateCollection"
        @close="handleCancelMigrateCollection">
        <p>
          Switching collections will prevent this asset from being accessed
          while the migration is taking place. It may also make assets
          temporarily unavilable.
        </p>

        <p>
          Upon confirmation, your asset will be saved and you will be redirected
          to your list of assets.
        </p>
      </ConfirmModal>
    </Teleport>
  </div>
</template>
<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { useInstanceStore } from "@/stores/instanceStore";
import Button from "@/components/Button/Button.vue";
import {
  Asset,
  UnsavedAsset,
  Template,
  PHPDateTime,
  WidgetProps,
  WidgetContent,
  TemplateComparison,
} from "@/types";
import SelectGroup from "@/components/SelectGroup/SelectGroup.vue";
import { MutationStatus } from "@tanstack/vue-query";
import { SpinnerIcon } from "@/icons";
import { CheckCircle2Icon, TriangleAlert } from "lucide-vue-next";
import InputGroup from "../InputGroup/InputGroup.vue";
import TableOfContents, {
  TocItem,
} from "../TableOfContents/TableOfContents.vue";
import { hasWidgetContent } from "@/helpers/hasWidgetContent";
import invariant from "tiny-invariant";
import {
  fetchCollectionComparison,
  fetchTemplateComparison,
} from "@/api/fetchers";
import { isEmpty } from "ramda";
import ConfirmModal from "@/components/ConfirmModal/ConfirmModal.vue";
import { useRouter } from "vue-router";

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
  (e: "migrateCollection", collectionId: number): void;
}>();

const state = reactive({
  localTemplateId: String(props.asset.templateId ?? ""),
  templateComparison: null as TemplateComparison | [] | null,
  isConfirmingTemplateChange: false,
  localCollectionId: String(props.asset.collectionId ?? ""),
  collectionComparison: null as { migration: boolean } | null,
  isConfirmingMigrateCollection: false,
});

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

const phpDateToString = (phpDateTime: PHPDateTime | null): string => {
  if (!phpDateTime?.date) {
    return "";
  }
  return new Date(phpDateTime.date).toISOString().split("T")[0];
};

const localAvailableAfterDate = ref("");

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
    .toSorted((a, b) => a.viewOrder - b.viewOrder)
    .map((widgetDef: WidgetProps) => {
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

// the use has selected a new template Id, we need to fetch
// a template comparison and then confirm
// if they cancel, reset the templateId to the
async function compareTemplatesAndConfirm(value: string) {
  const valueInt = Number.parseInt(value);
  invariant(!Number.isNaN(valueInt), "newTemplateId should be a number");

  state.templateComparison = await fetchTemplateComparison(
    props.asset.templateId as number,
    valueInt
  );

  // if the template comparison is empty, it means the
  // we can change template without issue, so don't bother
  // confirming
  if (!state.templateComparison || isEmpty(state.templateComparison)) {
    handleConfirmTemplateChange();
    return;
  }

  state.isConfirmingTemplateChange = true;
}

function handleConfirmTemplateChange() {
  emit("update:templateId", state.localTemplateId);
  state.isConfirmingTemplateChange = false;
  state.templateComparison = null;
}

function handleCancelTemplateChange() {
  // reset the local templateId to the original value
  state.localTemplateId = String(props.asset.templateId ?? "");
  state.isConfirmingTemplateChange = false;
  state.templateComparison = null;
}

async function compareCollectionsAndConfirm(value: string) {
  const newCollectionId = Number.parseInt(value);
  invariant(
    !Number.isNaN(newCollectionId),
    "newCollectionId should be a number"
  );

  state.collectionComparison = await fetchCollectionComparison(
    props.asset.collectionId as number,
    newCollectionId
  );

  // if migration is false, it means that we can change collection without
  // issue
  if (!state.collectionComparison.migration) {
    emit("update:asset", {
      ...props.asset,
      collectionId: newCollectionId,
    });
    state.isConfirmingMigrateCollection = false;
    state.collectionComparison = null;
    return;
  }

  state.isConfirmingMigrateCollection = true;
}

function handleConfirmMigrateCollection() {
  const newCollectionId = Number.parseInt(state.localCollectionId);
  emit("migrateCollection", newCollectionId);
  state.isConfirmingMigrateCollection = false;
  state.collectionComparison = null;
}

function handleCancelMigrateCollection() {
  // reset the local collectionId to the original value
  state.localCollectionId = String(props.asset.collectionId ?? "");
  state.isConfirmingMigrateCollection = false;
  state.collectionComparison = null;
}
</script>
<style>
.select-picker-light {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23ffffff' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
}
</style>
