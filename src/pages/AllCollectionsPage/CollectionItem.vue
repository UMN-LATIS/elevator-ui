<template>
  <div class="collection-item rounded-md flex flex-col">
    <div class="collection-item__parent flex-1 flex rounded-md">
      <button
        v-if="collection.children?.length"
        class="collection-item__parent-expand-button px-2 py-3 flex items-center rounded-md justify-center duration-150"
        @click="showMore = !showMore">
        <ChevronDown v-if="showMore" class="size-4" />
        <ChevronRight v-else class="size-4" />
      </button>
      <Link
        class="collection-item__parent-link flex items-center gap-2 flex-1 !no-underline rounded-md"
        :to="`/collections/browseCollection/${collection.id}`"
        :class="{
          'p-3': nestingLevel === 0,
          'py-2': nestingLevel !== 0,
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
        :nestingLevel="nestingLevel + 1"
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
