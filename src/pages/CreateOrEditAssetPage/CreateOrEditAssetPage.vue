<template>
  <DefaultLayout>
    <form
      v-if="!assetId && !state.localAsset"
      class="flex flex-col gap-4 w-full max-w-sm mx-auto mt-12 bg-white rounded-md border border-neutral-900 p-4"
      @submit.prevent="initAsset">
      <SelectGroup
        v-model="state.initialTemplateId"
        :options="
          instanceStore.instance.templates?.map((template) => ({
            label: template.name,
            id: template.id.toString(),
          })) ?? []
        "
        label="Template"
        required />
      <SelectGroup
        v-model="state.initialCollectionId"
        :options="
          instanceStore.collections?.map((collection) => ({
            label: collection.title,
            id: collection.id.toString(),
          })) ?? []
        "
        label="Collection"
        required />

      <Button
        type="submit"
        variant="primary"
        class="block my-4 w-full"
        :disabled="!state.initialTemplateId || !state.initialCollectionId">
        Continue
      </Button>
    </form>
    <Transition v-else name="fade">
      <EditAssetForm
        v-if="state.localAsset && savedTemplate"
        :template="savedTemplate"
        :asset="state.localAsset"
        :title="
          assetId
            ? `Edit Asset: ${state.localAsset.title?.[0] ?? ''}`
            : 'Create Asset'
        "
        :saveStatus="saveAssetStatus"
        :isDirty="hasAssetChanged"
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
import { Asset, UpdateAssetRequestFormData, WidgetContent } from "@/types";
import invariant from "tiny-invariant";
import { useUpdateAssetMutation } from "@/queries/useUpdateAssetMutation";
import { equals } from "ramda";
import Button from "@/components/Button/Button.vue";
import SelectGroup from "@/components/SelectGroup/SelectGroup.vue";
import { useRouter } from "vue-router";

const props = withDefaults(
  defineProps<{
    assetId?: string | null;
    title?: string;
  }>(),
  {
    assetId: null,
    title: "Edit Asset",
  }
);

const state = reactive({
  localAsset: null as Asset | null,
  initialTemplateId: "",
  initialCollectionId: "",
});

const { data: savedAsset } = useAssetQuery(toRef(props.assetId), {
  enabled: () => !!props.assetId,
});

const isCreateMode = computed(() => {
  return !props.assetId;
});

const localAssetWithoutIds = computed(() => {
  if (!savedTemplate.value || !state.localAsset) return null;
  if (!state.localAsset) return null;

  const clonedLocalAsset = JSON.parse(
    JSON.stringify(state.localAsset)
  ) as Asset;

  invariant(clonedLocalAsset, "Cannot clone local asset");

  for (const widgetDef of savedTemplate.value.widgetArray) {
    const fieldTitle = widgetDef.fieldTitle;
    const contents = clonedLocalAsset[fieldTitle] as WidgetContent[];
    if (!contents) continue;
    for (const content of contents) {
      delete content.id;
    }
  }
  return clonedLocalAsset;
});

const hasAssetChanged = computed(() => {
  return !equals(savedAsset.value, localAssetWithoutIds.value);
});

const savedTemplateId = computed(() => {
  return savedAsset.value?.templateId ?? state.initialTemplateId;
});

const { data: savedTemplate } = useTemplateQuery(savedTemplateId, {
  enabled: () => !!savedTemplateId.value,
});
const {
  mutate: saveAsset,
  status: saveAssetStatus,
  reset: resetSaveAssetStatus,
} = useUpdateAssetMutation();

const instanceStore = useInstanceStore();

function initAsset() {
  if (!savedTemplate.value) return;

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

const router = useRouter();

function handleSaveAsset() {
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
    objectId: props.assetId ?? "",
    templateId: String(state.localAsset.templateId),
    newTemplateId: String(state.localAsset.templateId),
    collectionId: String(state.localAsset.collectionId),
    newCollectionId: String(state.localAsset.collectionId),
    readyForDisplay: state.localAsset.readyForDisplay ? "on" : "off",
    availableAfter: "", // TODO: add date picker
    ...widgetContents,
  };
  saveAsset(formData, {
    onSuccess: (data) => {
      if (isCreateMode.value) {
        // redirect to the new asset page
        router.push({
          name: "asset",
          params: {
            assetId: data.objectId,
          },
        });
      }
      setTimeout(() => {
        resetSaveAssetStatus();
      }, 3000);
    },
  });
}
</script>
<style scoped></style>
