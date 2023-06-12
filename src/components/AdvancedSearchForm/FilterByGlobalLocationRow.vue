<template>
  <div class="">
    Global Location Row
    {{ searchStore.filterBy.globalLocation }}
  </div>
</template>
<script setup lang="ts">
import { useSearchStore } from "@/stores/searchStore";

const searchStore = useSearchStore();
</script>
<style scoped></style>
