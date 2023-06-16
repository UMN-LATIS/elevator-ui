<template>
  <DefaultLayout>
    <div class="max-w-lg mx-auto mt-12">
      <h1 class="text-4xl font-bold mb-8">Add Asset</h1>

      <form
        :action="`${BASE_URL}/assetManager/addAsset`"
        method="POST"
        class="flex flex-col gap-4"
      >
        <label for="templateId">Choose a template </label>
        <select id="templateId" name="templateId" class="rounded-md">
          <option value="" disabled selected>--</option>
          <option
            v-for="template in instanceStore.instance.templates"
            :key="template.id"
            :value="template.id"
          >
            {{ template.name }}
          </option>
        </select>
        <Button type="submit" variant="primary" class="block my-4 w-full"
          >Add Asset</Button
        >
      </form>
    </div>
  </DefaultLayout>
</template>
<script setup lang="ts">
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import { useInstanceStore } from "@/stores/instanceStore";
import Button from "@/components/Button/Button.vue";
import config from "@/config";

const BASE_URL = config.instance.base.url;
const instanceStore = useInstanceStore();
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
