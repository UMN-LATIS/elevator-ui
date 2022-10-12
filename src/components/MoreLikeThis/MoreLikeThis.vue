<template>
  <Button v-if="items.length" variant="tertiary" @click="isOpen = !isOpen">
    More Like This
    <span
      class="inline-flex items-center px-2 py-1 rounded-full font-medium bg-neutral-900 text-neutral-100"
    >
      {{ items.length }}
    </span>
  </Button>
  <Modal
    v-if="items.length"
    label="More Like This"
    :isOpen="isOpen"
    class="inset-4 max-w-screen max-h-screen w-auto"
    @close="isOpen = false"
  >
    <CardGrid>
      <SearchResultCard
        v-for="searchMatch in items"
        :key="searchMatch.objectId"
        :searchMatch="searchMatch"
      />
    </CardGrid>
  </Modal>
</template>
<script setup lang="ts">
import { ref } from "vue";
import { SearchResultMatch } from "@/types";
import SearchResultCard from "../SearchResultCard/SearchResultCard.vue";
import Modal from "../Modal/Modal.vue";
import CardGrid from "../CardGrid/CardGrid.vue";
import Button from "@/components/Button/Button.vue";

defineProps<{
  items: SearchResultMatch[];
}>();

const isOpen = ref(false);
</script>
<style scoped></style>
