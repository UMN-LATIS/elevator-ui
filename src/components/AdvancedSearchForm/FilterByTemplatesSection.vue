<template>
  <section class="my-4">
    <header class="flex items-baseline gap-2">
      <h3 class="font-bold">Templates</h3>
      <Button
        v-if="selectedTemplates.length"
        variant="tertiary"
        @click="searchStore.clearCollectionIdFilters()">
        clear
      </Button>
    </header>

    <p class="text-on-surface-variant text-xs mb-2 italic">
      To limit your search to specific collections, choose "Add Collection"
      below.
    </p>

    <ul
      v-if="selectedTemplates.length"
      class="flex flex-wrap gap-2 bg-outline-variant/20 p-4 mb-4 rounded-md">
      <li
        v-for="template in selectedTemplates"
        :key="template.id"
        class="text-xs bg-surface rounded-md border border-outline inline-flex items-center text-on-surface px-2 py-1\">
        {{ template.name }}

        <button
          class="ml-2 h-full flex items-center justify-center"
          @click="searchStore.removeCollectionIdFilter(template.id)">
          <XIcon class="!h-3 !w-3" />
        </button>
      </li>
    </ul>

    <AdvSearchDropDown v-if="unselectedTemplates.length" label="Add Templates">
      <AdvSearchDropDownItem
        v-for="template in unselectedTemplates"
        :key="template.id"
        class="!whitespace-nowrap overflow-ellipsis overflow-x-hidden"
        :title="template.name"
        @click="searchStore.addTemplateIdFilter(template.id)">
        {{ template.name }}
      </AdvSearchDropDownItem>
    </AdvSearchDropDown>
  </section>
</template>
<script setup lang="ts">
import { computed } from "vue";
import Button from "@/components/Button/Button.vue";
import { XIcon } from "@/icons";
import { useSearchStore } from "@/stores/searchStore";
import AdvSearchDropDown from "./AdvSearchDropDown.vue";
import AdvSearchDropDownItem from "./AdvSearchDropDownItem.vue";
import { useElevatorInstance } from "@/composables/useElevatorInstance.js";
import { TemplateSummary } from "@/types/index.js";

const { instance } = useElevatorInstance();
const searchStore = useSearchStore();

const templates = computed(
  (): TemplateSummary[] => instance.value?.templates || []
);

const selectedTemplates = computed(() => {
  return templates.value
    .filter((template) =>
      searchStore.filterBy.templateIds.includes(template.id)
    )
    .sort((a, b) => a.name.localeCompare(b.name));
});

const unselectedTemplates = computed(() => {
  return templates.value
    .filter(
      (template) => !searchStore.filterBy.templateIds.includes(template.id)
    )
    .sort((a, b) => a.name.localeCompare(b.name));
});
</script>
<style scoped></style>
