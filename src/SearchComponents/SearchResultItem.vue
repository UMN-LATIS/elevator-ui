<template>
  <div>
    <img
      v-if="searchResult.primaryHandlerId"
      :src="getThumbURL(searchResult.primaryHandlerId)"
    />
    <h1>{{ title }}</h1>
    Assets: {{ searchResult.fileAssets }}
    <template v-for="entry in props.searchResult.entries" :key="entry.label">
      <ul>
        <strong>{{ entry.label }}:</strong>
        <li v-for="entryInner in entry.entries" :key="entryInner">
          {{ entryInner }}
        </li>
      </ul>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { SearchResultMatch } from "@/types";
import { getThumbURL } from "@/Helpers/displayUtils";
import { computed } from "vue";

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
</script>

<style scoped>
img {
  max-width: 100%;
}
</style>
