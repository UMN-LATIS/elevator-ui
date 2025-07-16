<template>
  <DefaultLayout>
    <form
      v-if="!assetId && !state.localAsset"
      class="flex flex-col gap-4 w-full max-w-sm mx-auto mt-12 bg-white rounded-md border border-neutral-900 p-4"
      @submit.prevent="initAsset">
      <SelectGroup
        v-model="state.initialTemplateId"
        :options="templateOptions"
        label="Template"
        required />
      <SelectGroup
        v-model="state.initialCollectionId"
        :options="collectionOptions"
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
        :saveStatus="saveAssetStatus"
        :hasUnsavedChanges="hasAssetChanged"
        :isValid="isFormValid"
        class="flex-1"
        @update:templateId="handleConfirmedTemplateIdUpdate($event)"
        @migrateCollection="handleMigrateCollection($event)"
        @save="handleSaveAsset"
        @update:asset="
          (updatedAsset) => {
            state.localAsset = updatedAsset;
          }
        " />
    </Transition>
    <ConfirmModal
      v-if="isConfirmLeaveModalOpen"
      :isOpen="isConfirmLeaveModalOpen"
      title="Unsaved Changes"
      type="warning"
      confirmLabel="Leave"
      cancelLabel="Stay"
      @close="onCancelLeave"
      @confirm="onConfirmLeave">
      <p>You have unsaved changes. Are you sure you want to leave?</p>
    </ConfirmModal>
  </DefaultLayout>
</template>
<script setup lang="ts">
import { computed, watch, toRaw, reactive, onMounted } from "vue";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import { useAssetQuery } from "@/queries/useAssetQuery";
import { useTemplateQuery } from "@/queries/useTemplateQuery";
import { useInstanceStore } from "@/stores/instanceStore";
import EditAssetForm from "@/pages/CreateOrEditAssetPage/EditAssetForm/EditAssetForm.vue";
import { createDefaultWidgetContent } from "@/helpers/createDefaultWidgetContents";
import {
  Asset,
  UpdateAssetRequestFormData,
  WidgetContent,
  UnsavedAsset,
  PHPDateTime,
  RelatedAssetSaveMessage,
} from "@/types";
import invariant from "tiny-invariant";
import { useUpdateAssetMutation } from "@/queries/useUpdateAssetMutation";
import { equals } from "ramda";
import Button from "@/components/Button/Button.vue";
import SelectGroup from "@/components/SelectGroup/SelectGroup.vue";
import {
  onBeforeRouteUpdate,
  useRoute,
  useRouter,
  onBeforeRouteLeave,
} from "vue-router";
import { hasWidgetContent } from "@/helpers/hasWidgetContent";
import { SAVE_RELATED_ASSET_TYPE } from "@/constants/constants";
import ConfirmModal from "@/components/ConfirmModal/ConfirmModal.vue";
import { useConfirmation } from "./useConfirmation";

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
  localAsset: null as Asset | UnsavedAsset | null,
  initialTemplateId: "",
  initialCollectionId: "",
});

const { data: savedAsset } = useAssetQuery(() => props.assetId, {
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
  if (!savedAsset.value) return true;

  const rawSavedAsset = toRaw(savedAsset.value);
  const rawLocalAsset = toRaw(localAssetWithoutIds.value);
  invariant(rawLocalAsset, "Cannot check asset changes");

  // console.log(explainObjectDifferences(rawSavedAsset, rawLocalAsset));

  // saved asset only has props for widgets that are not empty
  // so to check if an asset has changed, first check that every prop in the
  // save asset matches the local asset
  const someSavedContentDiffers = Object.entries(rawSavedAsset).some(
    ([key, savedValue]) => {
      const localValue = rawLocalAsset[key];
      return !equals(savedValue, localValue);
    }
  );

  // also we need to handle the case where the local asset has fields that
  // aren't yet in the saved asset
  const hasNewLocalPropWithContent = Object.entries(rawLocalAsset)
    // only check props that are not in the saved asset
    .filter(([key]) => !(key in rawSavedAsset))
    // if the prop has some content, the asset has changed
    .some(([, localValue]) =>
      hasWidgetContent(localValue as WidgetContent[], "any")
    );

  return someSavedContentDiffers || hasNewLocalPropWithContent;
});

const isFormValid = computed(() => {
  if (!savedTemplate.value || !state.localAsset) return false;

  const requiredWidgetDefs = savedTemplate.value.widgetArray.filter(
    (widgetDef) => widgetDef.required
  );

  return requiredWidgetDefs.every((widgetDef) => {
    invariant(state.localAsset);
    const fieldTitle = widgetDef.fieldTitle;
    const contents = state.localAsset[fieldTitle] as WidgetContent[];
    return hasWidgetContent(contents, widgetDef.type);
  });
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
const templateOptions = computed(() => {
  const templates = instanceStore.instance.templates ?? [];
  return templates.map((template) => ({
    label: template.name,
    id: template.id.toString(),
  }));
});

const defaultTemplateId = computed(() => {
  // if there's only one option, select it
  return templateOptions.value.length === 1 ? templateOptions.value[0].id : "";
});

const collectionOptions = computed(() => {
  const collections = instanceStore.collections ?? [];
  return collections.map((collection) => ({
    label: collection.title,
    id: collection.id.toString(),
  }));
});

const defaultCollectionId = computed(() => {
  // if there's only one option, select it
  return collectionOptions.value.length === 1
    ? collectionOptions.value[0].id
    : "";
});

onMounted(() => {
  if (!state.initialTemplateId) {
    state.initialTemplateId = defaultTemplateId.value;
  }
  if (!state.initialCollectionId) {
    state.initialCollectionId = defaultCollectionId.value;
  }
});

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
        // if this is an upload widget, default to an empty array
        // otherwise, create a default widget content
        state.localAsset[widgetDef.fieldTitle] =
          widgetDef.type === "upload"
            ? []
            : [createDefaultWidgetContent(widgetDef)];
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
  const initialAsset: Asset | UnsavedAsset = {
    assetId: null,
    templateId: savedTemplate.value.templateId,
    readyForDisplay: true,
    collectionId:
      Number.parseInt(state.initialCollectionId) ?? firstCollection.id,
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
    initialAsset[widgetDef.fieldTitle] =
      widgetDef.type === "upload"
        ? [] // don't add any upload item by default. we'll do that once we have an upload.
        : [createDefaultWidgetContent(widgetDef)];
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

async function handleConfirmedTemplateIdUpdate(newTemplateId: number) {
  invariant(state.localAsset, "Cannot change template: no asset.");

  state.localAsset.templateId = newTemplateId;
  handleSaveAsset();
}
const route = useRoute();
const router = useRouter();
const channelName = computed(() => route.query.channelName as string);

function getAssetAsSaveableFormData() {
  invariant(state.localAsset, "Cannot save: no asset.");
  invariant(savedTemplate.value, "Cannot save: no template.");

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
    readyForDisplay: state.localAsset.readyForDisplay as boolean,
    availableAfter: (state.localAsset.availableAfter as PHPDateTime)?.date,
    ...widgetContents,
  };

  return formData;
}

function handleSaveAsset() {
  invariant(state.localAsset, "Cannot save: no asset.");
  invariant(savedTemplate.value, "Cannot save: no template.");

  const formData = getAssetAsSaveableFormData();

  saveAsset(formData, {
    onSuccess: (data) => {
      setTimeout(() => {
        resetSaveAssetStatus();
      }, 3000);

      if (!isCreateMode.value) {
        return;
      }

      const newAssetId = data.objectId;

      // if we're creating a related asset, notify the parent
      if (channelName.value) {
        // notify parent asset page about the new related asset
        const channel = new BroadcastChannel(channelName.value);
        const message: RelatedAssetSaveMessage = {
          type: SAVE_RELATED_ASSET_TYPE,
          payload: {
            relatedAssetId: newAssetId,
          },
        };
        channel.postMessage(message);
        channel.close();
      }

      // redirect to the edit asset page (so that we don't keep recreating
      // new assets on each save!)
      router.replace({
        name: "editAsset",
        params: {
          assetId: newAssetId,
        },
      });
    },
  });
}

function handleMigrateCollection(newCollectionId: number) {
  invariant(state.localAsset, "Cannot change collection: no asset.");

  state.localAsset.collectionId = newCollectionId;
  const formData = getAssetAsSaveableFormData();

  saveAsset(formData, {
    onSuccess: () => {
      // TODO: maybe show a toast or something?

      // migrating the collection can take a bit of time, so redirect
      // the user to the all my assets page after saving to prevent
      // more editing during the migration
      router.push({
        name: "allMyAssets",
      });
    },
  });
}

const {
  showModal: isConfirmLeaveModalOpen,
  confirm: confirmLeave,
  onConfirm: onConfirmLeave,
  onCancel: onCancelLeave,
} = useConfirmation();

onBeforeRouteLeave(async (to, from, next) => {
  // no unsaved changes, proceed with navigation
  if (!hasAssetChanged.value) return next();

  // if navigating to login/logout page, just proceed
  if (
    typeof to.name === "string" &&
    ["localLogin", "logout"].includes(to.name)
  ) {
    return next();
  }
  // otherwise confirm
  const isConfirmed = await confirmLeave();
  return next(isConfirmed);
});

onBeforeRouteUpdate(async (to, from, next) => {
  if (to.fullPath !== "/assetManager/addAsset") {
    // if not navigating to create asset, just proceed
    return next();
  }

  // confirm if there are unsaved changes
  if (hasAssetChanged.value) {
    const isConfirmed = await confirmLeave();
    if (!isConfirmed) {
      return next(false);
    }
  }

  // reset the asset state
  state.localAsset = null;
  state.initialTemplateId = defaultTemplateId.value;
  state.initialCollectionId = defaultCollectionId.value;
  resetSaveAssetStatus();

  next();
});
</script>
<style scoped></style>
