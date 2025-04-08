<template>
  <DefaultLayout class="create-asset-page">
    <form
      v-if="!editAssetStore.asset"
      class="flex flex-col gap-4 w-full max-w-sm mx-auto mt-12 bg-white rounded-md border border-neutral-900 p-4"
      @submit.prevent="initializeAsset">
      <SelectGroup
        v-model="selectedTemplateId"
        :options="
          instanceStore.instance.templates?.map((template) => ({
            label: template.name,
            id: template.id.toString(),
          })) ?? []
        "
        label="Template"
        required />
      <SelectGroup
        v-model="selectedCollectionId"
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
        :disabled="!selectedTemplateId || !selectedCollectionId">
        Add Asset
      </Button>
    </form>
    <div v-else class="flex-1 flex h-full">
      <div class="flex-1 bg-white">
        <h1 class="text-4xl font-bold mb-8">Add Asset</h1>

        <code>
          <pre class="text-sm">
            {{ JSON.stringify(editAssetStore.asset, null, 2) }}
          </pre>
        </code>
      </div>
      <div class="md:w-xs flex flex-col gap-4 p-4">
        <SelectGroup
          v-model="selectedTemplateId"
          :options="
            instanceStore.instance.templates?.map((template) => ({
              label: template.name,
              id: template.id.toString(),
            })) ?? []
          "
          label="Template"
          required />
        <SelectGroup
          v-model="selectedCollectionId"
          :options="
            instanceStore.collections?.map((collection) => ({
              label: collection.title,
              id: collection.id.toString(),
            })) ?? []
          "
          label="Collection"
          required />
      </div>
    </div>
  </DefaultLayout>
</template>
<script setup lang="ts">
import { ref, watch } from "vue";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import { useInstanceStore } from "@/stores/instanceStore";
import Button from "@/components/Button/Button.vue";
import { useEditAssetStore } from "@/stores/useEditAssetStore";
import { useTemplateQuery } from "@/queries/useTemplateQuery";
import invariant from "tiny-invariant";
import { Template } from "@/types";
import SelectGroup from "@/components/SelectGroup/SelectGroup.vue";

const instanceStore = useInstanceStore();
const selectedTemplateId = ref("");
const selectedCollectionId = ref("");
const editAssetStore = useEditAssetStore();

const { data: selectedTemplate } = useTemplateQuery(() =>
  Number.parseInt(selectedTemplateId.value || "")
);

function initializeAsset() {
  invariant(selectedTemplate.value, "No template selected");
  invariant(selectedCollectionId.value, "No collection selected");

  editAssetStore.initAsset({
    template: selectedTemplate.value,
    collectionId: Number.parseInt(selectedCollectionId.value),
  });
}

watch(selectedTemplate, handleTemplateChange);

// users can lose data if they change the template
// while editing an asset, so we need to warn them
async function handleTemplateChange(
  newTemplate: Template | null,
  oldTemplate: Template | null
) {
  if (
    // we don't have an asset yet
    !editAssetStore.asset ||
    // we don't have a template yet
    !oldTemplate ||
    // the user is not changing the template
    newTemplate === oldTemplate
  ) {
    return;
  }

  // if the user is changing the template, warn before doing so
  const confirmed = confirm(
    "Changing the template will reset the asset. Are you sure you want to do this?"
  );
  if (!confirmed) {
    // reset the template id
    selectedTemplateId.value = oldTemplate.templateId.toString();
    return;
  }

  invariant(newTemplate);

  // TODO: do something smarter than just resetting the asset
  editAssetStore.initAsset({ template: newTemplate });
}
</script>
<style scoped>
.static-page__content {
  background: var(--app-backgroundColor);
  color: var(--app-textColor);
}

.prose :first-child {
  margin-top: 0;
}
</style>
