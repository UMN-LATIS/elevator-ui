<template>
  <div class="collection-item p-4 rounded">
    <div class="flex justify-between">
      <Link
        class="flex gap-2"
        :href="`${BASE_URL}/collections/browseCollection/${collection.id}`"
      >
        <img v-if="imgSrc" :src="imgSrc" :alt="collection.title" />
        <h2>{{ collection.title }}</h2>
      </Link>
      <button v-if="collection.children" @click="showMore = !showMore">
        <ChevronDownIcon v-if="!showMore" />
        <ChevronUpIcon v-else />
      </button>
    </div>
    <div v-if="collection.children">
      <CollectionItem
        v-for="child in collection.children"
        v-show="showMore"
        :key="child.id"
        :collection="child"
        class="p-2"
      />
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed, ref } from "vue";
import { getThumbURL } from "@/helpers/displayUtils";
import { AssetCollection } from "@/types";
import { ChevronDownIcon, ChevronUpIcon } from "@/icons";
import Link from "@/components/Link/Link.vue";
import config from "@/config";

const props = defineProps<{
  collection: AssetCollection;
}>();

const BASE_URL = config.instance.base.url;
const imgSrc = computed((): string | null => {
  const imgId = props.collection.previewImageId;
  return imgId ? getThumbURL(imgId) : null;
});

const showMore = ref(false);
</script>
<style scoped>
.collection-item {
  border: var(--app-accordion-outer-borderWidth) solid
    var(--app-accordion-outer-borderColor);
  background: var(--app-accordion-header-backgroundColor);
  color: var(--app-accordion-header-textColor);
}

/* prevent borders on nested collections */
.collection-item .collection-item {
  border: none;
}
</style>
