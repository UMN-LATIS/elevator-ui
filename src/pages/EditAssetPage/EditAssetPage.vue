<template>
  <DefaultLayout>
    <Transition name="fade">
      <EditAssetForm
        v-if="state.localAsset && savedTemplate"
        :template="savedTemplate"
        :asset="state.localAsset"
        :title="`Edit Asset: ${state.localAsset.title}`"
        class="flex-1"
        @update:templateId="() => console.log('TODO: handle templateId change')"
        @save="handleSaveAsset"
        @update:asset="
          (updatedAsset) => {
            state.localAsset = updatedAsset;
          }
        " />
    </Transition>
  </DefaultLayout>
</template>
<script setup lang="ts">
import { computed, watch, toRaw, reactive, toRef } from "vue";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import { useAssetQuery } from "@/queries/useAssetQuery";
import { useTemplateQuery } from "@/queries/useTemplateQuery";
import { useInstanceStore } from "@/stores/instanceStore";
import EditAssetForm from "@/components/EditAssetForm/EditAssetForm.vue";
import { createDefaultWidgetContent } from "@/helpers/createDefaultWidgetContents";
import {
  Asset,
  CreateAssetRequestFormData,
  UpdateAssetRequestFormData,
  WidgetContent,
} from "@/types";
import invariant from "tiny-invariant";
import { useUpdateAssetMutation } from "@/queries/useUpdateAssetMutation";

const props = withDefaults(
  defineProps<{
    assetId: string | null;
    title?: string;
  }>(),
  {
    assetId: null,
    title: "Edit Asset",
  }
);

const state = reactive({
  localAsset: null as Asset | null,
});

const { data: savedAsset } = useAssetQuery(toRef(props.assetId), {
  enabled: () => !!props.assetId,
});

const savedTemplateId = computed(() => {
  return savedAsset.value?.templateId ?? null;
});

const { data: savedTemplate } = useTemplateQuery(savedTemplateId, {
  enabled: () => !!savedTemplateId.value,
});
const { mutate: saveAsset } = useUpdateAssetMutation();

const instanceStore = useInstanceStore();

function initAsset() {
  if (!savedAsset.value || !savedTemplate.value) return;

  // if we have an asset, set it
  if (savedAsset.value) {
    // use `toRaw` so that we don't have a proxy object
    // and we can use `structuredClone` to deep clone the asset
    state.localAsset = structuredClone(toRaw(savedAsset.value));

    // loop thru saved asset
    for (const widgetDef of savedTemplate.value.widgetArray) {
      // if the asset doesn't have the field, create it
      if (!state.localAsset[widgetDef.fieldTitle]) {
        state.localAsset[widgetDef.fieldTitle] = [
          createDefaultWidgetContent(widgetDef),
        ];
      }

      const widgetContents = state.localAsset[
        widgetDef.fieldTitle
      ] as WidgetContent[];

      // add a unique id to each widget content for better reactivity
      for (const widgetContent of widgetContents) {
        widgetContent.id ??= crypto.randomUUID();
      }
    }
    return;
  }

  const firstCollection = instanceStore.collections[0];

  invariant(firstCollection, "Cannot initialize asset without a collection");

  // create the asset
  const initialAsset: Asset = {
    id: `TEMP_ASSET_ID-${Date.now()}`,
    templateId: savedTemplate.value.templateId,
    readyForDisplay: false,
    collectionId: firstCollection.id,
    availableAfter: null,
    modified: {
      date: new Date().toISOString(),
      timezone_type: 3,
      timezone: "UTC",
    },
    modifiedBy: 0,
    createdBy: 0,
    deletedBy: null,
    relatedAssetCache: null,
    firstFileHandlerId: null,
    firstObjectId: null,
    titleObject: null,
    title: [""],
  };

  // add fields for each widget in the template
  savedTemplate.value.widgetArray.forEach((widgetDef) => {
    initialAsset[widgetDef.fieldTitle] = [
      createDefaultWidgetContent(widgetDef),
    ];
  });

  state.localAsset = initialAsset;
}

watch(
  [savedAsset, savedTemplate],
  () => {
    if (!savedAsset.value || !savedTemplate.value) return;
    initAsset();
  },
  { immediate: true }
);

function handleSaveAsset() {
  invariant(!!props.assetId, "Cannot save: no assetId.");
  invariant(state.localAsset, "Cannot save: no asset.");
  invariant(savedTemplate.value, "Cannot save: no template.");
  console.log({ localAsset: state.localAsset, savedTemplate, savedAsset });
  // TODO: handle template changes
  invariant(
    state.localAsset.templateId === savedTemplate.value.templateId,
    "Cannot save: template mismatch."
  );

  const widgetContents = savedTemplate.value.widgetArray.reduce(
    (acc, widgetDef) => {
      invariant(state.localAsset);
      const fieldTitle = widgetDef.fieldTitle;
      const contents = state.localAsset[fieldTitle] as WidgetContent[];

      return {
        ...acc,
        [fieldTitle]: contents ?? createDefaultWidgetContent(widgetDef),
      };
    },
    {} as Record<string, WidgetContent[]>
  );

  const formData: UpdateAssetRequestFormData = {
    objectId: props.assetId,
    templateId: String(state.localAsset.templateId),
    newTemplateId: String(state.localAsset.templateId),
    collectionId: String(state.localAsset.collectionId),
    newCollectionId: String(state.localAsset.collectionId),
    readyForDisplay: state.localAsset.readyForDisplay ? "on" : "off",
    availableAfter: "", // TODO: add date picker
    ...widgetContents,
  };

  saveAsset(formData);
}
</script>
<style scoped></style>
