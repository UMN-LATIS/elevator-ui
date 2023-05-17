<template>
  <div
    :class="{ hidden: !isOpen, block: isOpen }"
    class="bg-white rounded-lg shadow-md w-full relative"
  >
    <XButton class="absolute top-4 right-4" @click="$emit('close')" />
    <div class="p-4">
      <h1
        class="uppercase font-bold text-xs text-neutral-900 my-2 border-b pb-4"
      >
        Advanced Search
      </h1>
      <section>
        <h2 class="font-bold my-4">Collections</h2>

        <ul v-if="selectedCollections.length">
          <li v-for="collection in selectedCollections" :key="collection.id">
            {{ collection.title }}
          </li>
        </ul>

        <DropDown
          label="Add Collection"
          class="border border-neutral-900 rounded-md"
          alignment="left"
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

defineProps<{
  isOpen: boolean;
}>();

defineEmits<{
  (eventName: "close", event: Event): void;
}>();

const instanceStore = useInstanceStore();

const selectedCollectionIds = reactive<number[]>([]);

const selectedCollections = computed(() => {
  return instanceStore.collections.filter((collection) =>
    selectedCollectionIds.includes(collection.id)
  );
});

const unselectedCollections = computed(() => {
  return instanceStore.collections.filter(
    (collection) => !selectedCollectionIds.includes(collection.id)
  );
});

function handleAddCollection(collectionId: number) {
  selectedCollectionIds.push(collectionId);
}
</script>
<style scoped></style>
