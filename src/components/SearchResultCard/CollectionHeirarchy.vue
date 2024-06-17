<template>
  <div v-if="collectionHierarchy?.length">
    <dt class="font-bold text-xs uppercase">Collection</dt>
    <dd>
      <span
        v-for="collection in collectionHierarchy"
        :key="collection.id"
        class="after:content-['/'] after:mr-1 after:ml-1 after:text-neutral-400 after:last:content-none">
        {{ collection.title }}
      </span>
    </dd>
  </div>
</template>
<script setup lang="ts">
import * as T from "@/types";

defineProps<{
  collectionHierarchy: T.SearchResultMatch["collectionHierarchy"];
}>();
</script>
<style scoped></style>
