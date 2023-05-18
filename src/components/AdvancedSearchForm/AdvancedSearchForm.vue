<template>
  <div
    :class="{ hidden: !isOpen, block: isOpen }"
    class="bg-white rounded-2xl shadow-md w-full relative"
  >
    <div class="p-4">
      <header class="flex gap-2 items-center justify-between mb-2">
        <h1 class="uppercase font-bold text-xs text-neutral-900">
          Advanced Search
        </h1>
        <XIcon @click="$emit('close')" />
      </header>

      <InputGroup
        id="search"
        ref="inputGroup"
        :value="searchStore.query"
        label="Search"
        :labelHidden="true"
        placeholder="Search"
        inputClass="!rounded-full"
      />

      <section>
        <h2 class="font-bold my-4">Collections</h2>

        <ul v-if="selectedCollections.length" class="flex flex-wrap gap-2 my-4">
          <li
            v-for="collection in selectedCollections"
            :key="collection.id"
            class="text-xs bg-neutral-100 py-1 px-2 rounded-md border border-neutral-200 inline-flex items-center"
          >
            {{ collection.title }}

            <button class="ml-2" @click="handleRemoveCollection(collection.id)">
              <XIcon class="h-3 w-3" />
            </button>
          </li>
        </ul>

        <DropDown
          label="Add Collection"
          class="border border-neutral-900 rounded-md"
          alignment="left"
          labelClass="text-sm py-2"
        >
          <div class="max-h-[25vh] overflow-y-auto">
            <DropDownItem
              v-for="collection in unselectedCollections"
              :key="collection.id"
              @click="handleAddCollection(collection.id)"
            >
              {{ collection.title }}
            </DropDownItem>
          </div>
        </DropDown>
      </section>
    </div>
    <div
      class="flex bg-transparent-black-100 px-4 py-2 justify-end items-center gap-4"
    >
      <Button variant="tertiary">Reset All</Button>
      <Button variant="primary">Search</Button>
    </div>
  </div>
</template>
<script setup lang="ts">
import { reactive, computed } from "vue";
import XButton from "@/components/XButton/XButton.vue";
import Button from "@/components/Button/Button.vue";
import DropDown from "../DropDown/DropDown.vue";
import DropDownItem from "../DropDown/DropDownItem.vue";
import { useInstanceStore } from "@/stores/instanceStore";
import { XIcon } from "@/icons";
import InputGroup from "@/components/InputGroup/InputGroup.vue";
import { useSearchStore } from "@/stores/searchStore";

defineProps<{
  isOpen: boolean;
}>();

defineEmits<{
  (eventName: "close", event: Event): void;
}>();

const instanceStore = useInstanceStore();
const searchStore = useSearchStore();
const selectedCollectionIds = reactive<number[]>([]);

const selectedCollections = computed(() => {
  return instanceStore.collections
    .filter((collection) => selectedCollectionIds.includes(collection.id))
    .sort((a, b) => a.title.localeCompare(b.title));
});

const unselectedCollections = computed(() => {
  return instanceStore.collections.filter(
    (collection) => !selectedCollectionIds.includes(collection.id)
  );
});

function handleAddCollection(collectionId: number) {
  selectedCollectionIds.push(collectionId);
}

function handleRemoveCollection(collectionId: number) {
  const index = selectedCollectionIds.indexOf(collectionId);
  selectedCollectionIds.splice(index, 1);
}
</script>
<style scoped></style>
