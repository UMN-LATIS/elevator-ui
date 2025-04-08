<template>
  <DefaultLayout class="create-asset-page">
    <div class="max-w-lg mx-auto mt-12">
      <h1 class="text-4xl font-bold mb-8">Add Asset</h1>

      <form
        v-if="!isAssetReadyForEdits"
        class="flex flex-col gap-4"
        @submit.prevent="handleAddAssetClick">
        <label for="templateId">Choose a template</label>
        <select
          id="templateId"
          v-model="selectedTemplateId"
          name="templateId"
          class="rounded-md"
          required>
          <option value="" disabled selected>--</option>
          <option
            v-for="template in instanceStore.instance.templates"
            :key="template.id"
            :value="template.id">
            {{ template.name }}
          </option>
        </select>
        <label for="collectionId">Collection</label>
        <select
          id="collectionId"
          v-model="selectedCollectionId"
          class="rounded-md"
          required>
          <option value="" disabled selected>--</option>
          <option
            v-for="collection in instanceStore.collections"
            :key="collection.id"
            :value="collection.id">
            {{ collection.title }}
          </option>
        </select>
        <Button
          type="submit"
          variant="primary"
          class="block my-4 w-full"
          :disabled="!selectedTemplateId || !selectedCollectionId">
          Continue
        </Button>
      </form>
      <div v-else>
        <p>Let the edits begin.</p>
      </div>
    </div>
  </DefaultLayout>
</template>
<script setup lang="ts">
import { ref } from "vue";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import { useInstanceStore } from "@/stores/instanceStore";
import Button from "@/components/Button/Button.vue";

const instanceStore = useInstanceStore();

const selectedTemplateId = ref<string | null>("");
const selectedCollectionId = ref<string | null>("");
const isAssetReadyForEdits = ref(false);

function handleAddAssetClick() {
  if (!selectedTemplateId.value || !selectedCollectionId.value) {
    return;
  }

  // fetch template

  // init asset store with asset based on template

  isAssetReadyForEdits.value = true;
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
