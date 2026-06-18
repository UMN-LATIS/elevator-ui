<template>
  <section v-if="items.length" class="more-like-this">
    <div v-if="inlineResultsList.length" class="pt-6 mt-6">
      <h3
        class="more-like-this__title flex flex-wrap items-center gap-2 mb-4 text-xl font-bold">
        <span>More Like This</span>
        <CountChip>{{ items.length }}</CountChip>
      </h3>

      <div class="more-like-this__list">
        <SearchResultCard
          v-for="searchMatch in inlineResultsList"
          :key="searchMatch.objectId"
          :searchMatch="searchMatch" />
      </div>
    </div>
    <ButtonWithCount
      v-if="numOfSeeMoreResults"
      :count="numOfSeeMoreResults"
      class="my-4"
      @click="isShowingFullListOfResults = true">
      {{
        config.instance.moreLikeThis.maxInlineResults
          ? "Show More"
          : "More Like This"
      }}
    </ButtonWithCount>

    <Modal
      label="More Like This"
      :isOpen="isShowingFullListOfResults"
      @close="isShowingFullListOfResults = false">
      <template #label>
        <span>More Like This</span>
        <CountChip class="ml-2">{{ items.length }}</CountChip>
      </template>
      <div class="grid grid-cols-3 gap-2">
        <SearchResultCard
          v-for="searchMatch in items"
          :key="searchMatch.objectId"
          :searchMatch="searchMatch" />
      </div>
    </Modal>
  </section>
</template>
<script setup lang="ts">
import { computed, ref } from "vue";
import { SearchResultMatch } from "@/types";
import SearchResultCard from "../SearchResultCard/SearchResultCard.vue";
import config from "@/config";
import Modal from "../Modal/Modal.vue";
import ButtonWithCount from "./ButtonWithCount.vue";
import CountChip from "./CountChip.vue";

const props = defineProps<{
  items: SearchResultMatch[];
}>();

const inlineResultsList = computed(() => {
  return props.items.slice(0, config.instance.moreLikeThis.maxInlineResults);
});

const numOfSeeMoreResults = computed(() => {
  return props.items.length - inlineResultsList.value.length;
});

const isShowingFullListOfResults = ref(false);
</script>
<style scoped>
.more-like-this {
  container-type: inline-size;
}

.more-like-this__title {
  color: var(--app-mediaCard-title-textColor);
}

.more-like-this__list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

/* Go two-up once the component itself has room, regardless of where
   it's placed (narrow asset panel vs. wide metadata-only page). */
@container (min-width: 32rem) {
  .more-like-this__list {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
