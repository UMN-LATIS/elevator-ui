<template>
  <div class="collection-item p-4 rounded border">
    <div class="flex items-center gap-1">
      <button
        v-if="collection.children"
        class="p-2 -ml-2 rounded-full inline-flex items-center justify-center"
        @click="showMore = !showMore"
      >
        <ChevronDownIcon
          class="transform w-4 h-4"
          :class="{
            '-rotate-90': !showMore,
          }"
        />
      </button>
      <Link
        class="flex gap-2 flex-1 items-center"
        :to="`/collections/browseCollection/${collection.id}`"
      >
        <LazyLoadImage
          v-if="imgSrc"
          :src="imgSrc"
          :alt="collection.title"
          class="w-6 h-6 object-cover rounded-md"
        />
        <h2 :class="{ 'font-bold': showMore }">{{ collection.title }}</h2>
      </Link>
    </div>
    <div v-if="collection.children">
      <CollectionItem
        v-for="child in collection.children"
        v-show="showMore"
        :key="child.id"
        :collection="child"
        class="p-0 m-2 ml-8"
      />
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
