<template>
  <MediaCard
    :title="title"
    :imgSrc="thumbnailImgSrc"
    :imgAlt="title"
    class="hover:shadow-lg transition-shadow"
  >
    <dl v-if="props.searchResult?.entries" class="flex flex-col gap-4">
      <div v-for="(entry, index) in props.searchResult.entries" :key="index">
        <dt class="text-xs text-neutral-400 uppercase">
          {{ entry?.label || "Item" }}
        </dt>

        <dd v-if="entry.entries && entry.entries.length > 1" class="flex gap-2">
          <Chip v-for="listItem in entry.entries" :key="listItem" class="my-1">
            {{ listItem }}
          </Chip>
        </dd>
        <dd v-else>{{ entry.entries?.join(" ") }}</dd>
      </div>
    </dl>
    <div class="flex justify-end">
      <button
        class="flex justify-center items-center bg-neutral-100 p-2 rounded-full hover:bg-neutral-900 hover:text-white"
      >
        <Icon>arrow_forward</Icon>
      </button>
    </div>
  </MediaCard>
</template>

<script lang="ts" setup>
import { SearchResultMatch } from "@/types";
import { getThumbURL } from "@/helpers/displayUtils";
import { computed } from "vue";
import Icon from "@/components/Icon/Icon.vue";
import Chip from "@/components/Chip/Chip.vue";
import MediaCard from "../MediaCard/MediaCard.vue";

const props = defineProps<{
  searchResult: SearchResultMatch;
}>();

const title = computed(() => {
  if (Array.isArray(props.searchResult.title)) {
    return props.searchResult.title.join(",");
  }

  if (props.searchResult.title && props.searchResult.title.length > 0) {
    return props.searchResult.title;
  }

  return "(no title)";
});

const thumbnailImgSrc = computed(() => {
  const { primaryHandlerId } = props.searchResult;
  return primaryHandlerId ? getThumbURL(primaryHandlerId) : null;
});
</script>

<style scoped>
img {
  max-width: 100%;
}
</style>
