<template>
  <div class="collection-item rounded-md">
    <div class="collection-item__parent flex items-center rounded-md">
      <button
        v-if="collection.children && collection.children.length > 0"
        class="collection-item__parent-expand-button p-3 inline-flex items-center rounded-md justify-center duration-150"
        @click="showMore = !showMore">
        <ChevronDown v-if="showMore" class="size-4" />
        <ChevronRight v-else class="size-4" />
      </button>
      <Link
        class="collection-item__parent-link flex gap-2 flex-1 items-center !no-underline h-full p-2 rounded-md"
        :to="`/collections/browseCollection/${collection.id}`"
        :class="{
          // add padding if root collections have no children
          'pl-4': nestingLevel === 0 && !collection.children?.length,
        }">
        <LazyLoadImage
          v-if="imgSrc"
          :src="imgSrc"
          :alt="collection.title"
          class="w-6 h-6 object-cover rounded-md" />
        <h2 :class="{ 'font-bold': showMore }">{{ collection.title }}</h2>
      </Link>
    </div>
    <div v-if="viewableChildren.length" class="collection-item__children">
      <CollectionItem
        v-for="child in viewableChildren"
        v-show="showMore"
        :key="child.id"
        :collection="child"
        class="ml-8" />
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed, ref } from "vue";
import { getThumbURL } from "@/helpers/displayUtils";
import { AssetCollection } from "@/types";
import Link from "@/components/Link/Link.vue";
import LazyLoadImage from "@/components/LazyLoadImage/LazyLoadImage.vue";
import { ChevronDown, ChevronRight } from "lucide-vue-next";

const props = withDefaults(
  defineProps<{
    collection: AssetCollection;
    nestingLevel?: number;
  }>(),
  {
    nestingLevel: 0,
  }
);

const imgSrc = computed((): string | null => {
  const imgId = props.collection.previewImageId;
  return imgId ? getThumbURL(imgId) : null;
});

const viewableChildren = computed(() => {
  return props.collection.children
    ? props.collection.children.filter((c) => c.canView)
    : [];
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

.collection-item__parent-link:hover,
.collection-item__parent-expand-button:hover {
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
