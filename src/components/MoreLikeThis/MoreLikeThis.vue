<template>
  <section v-if="items.length" class="more-like-this pt-6 mt-6">
    <div v-if="inlineResultsList.length">
      <h3
        class="more-like-this__title flex flex-wrap items-center gap-2 mb-4 text-xl font-bold"
      >
        <span>More Like This</span>
        <CountChip>{{ items.length }}</CountChip>
      </h3>

      <SearchResultCard
        v-for="searchMatch in inlineResultsList"
        :key="searchMatch.objectId"
        :searchMatch="searchMatch"
      />
    </div>
    <ButtonWithCount
      v-if="numOfSeeMoreResults"
      :count="numOfSeeMoreResults"
      class="my-4"
      @click="isShowingFullListOfResults = true"
    >
      {{
        config.moreLikeThis.maxInlineResults ? "Show More" : "More Like This"
      }}
    </ButtonWithCount>

    <Modal
      label="More Like This"
      :isOpen="isShowingFullListOfResults"
      @close="isShowingFullListOfResults = false"
    >
      <div class="grid grid-cols-3 gap-2">
        <SearchResultCard
          v-for="searchMatch in items"
          :key="searchMatch.objectId"
          :searchMatch="searchMatch"
        />
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
  return props.items.slice(0, config.moreLikeThis.maxInlineResults);
});

const numOfSeeMoreResults = computed(() => {
  return props.items.length - inlineResultsList.value.length;
});

const isShowingFullListOfResults = ref(false);
</script>
<style scoped>
.more-like-this__title {
  color: var(--app-mediaCard-title-textColor);
}
</style>
