<template>
  <div
    class="all-collections-page__collection-item p-4 rounded border transition-colors duration-150">
    <div class="flex items-center gap-1">
      <button
        v-if="collection.children && collection.children.length > 0"
        class="p-2 -ml-2 rounded-full inline-flex items-center justify-center hover:bg-white transition-colors duration-150"
        @click="showMore = !showMore">
        <ChevronDownIcon
          class="transform w-4 h-4"
          :class="{
            '-rotate-90': !showMore,
          }" />
      </button>
      <Link
        class="flex gap-2 flex-1 items-center !no-underline h-full"
        :to="`/collections/browseCollection/${collection.id}`">
        <LazyLoadImage
          v-if="imgSrc"
          :src="imgSrc"
          :alt="collection.title"
          class="w-6 h-6 object-cover rounded-md" />
        <h2 :class="{ 'font-bold': showMore }">{{ collection.title }}</h2>
      </Link>
    </div>
    <div v-if="collection.children">
      <CollectionItem
        v-for="child in collection.children"
        v-show="showMore"
        :key="child.id"
        :collection="child"
        class="!p-0 m-2 ml-8" />
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed, ref } from "vue";
import { getThumbURL } from "@/helpers/displayUtils";
import { AssetCollection } from "@/types";
import { ChevronDownIcon } from "@/icons";
import Link from "@/components/Link/Link.vue";
import LazyLoadImage from "@/components/LazyLoadImage/LazyLoadImage.vue";

const props = defineProps<{
  collection: AssetCollection;
}>();

const imgSrc = computed((): string | null => {
  const imgId = props.collection.previewImageId;
  return imgId ? getThumbURL(imgId) : null;
});

const showMore = ref(false);
</script>
<style scoped>
.collection-item {
  background: var(--app-mediaCard-backgroundColor);
  color: var(--app-mediaCard-textColor);
  border: var(--app-mediaCard-borderWidth) solid
    var(--app-mediaCard-borderColor);

  & :is(h1, h2, h3, h4, h5, a) {
    color: var(--app-mediaCard-textColor);
  }
}

.collection-item:hover {
  --hover-text-color: var(--color-blue-600);
  --hover-bg-color: var(--color-blue-50);
  background: var(--hover-bg-color);
  color: var(--hover-text-color);
  border-color: var(--hover-text-color);

  & :is(h1, h2, h3, h4, h5, a) {
    color: var(--hover-text-color);
  }
}

/* prevent borders on nested collections */
.collection-item .collection-item {
  border: none;
  background: transparent;
}
</style>
