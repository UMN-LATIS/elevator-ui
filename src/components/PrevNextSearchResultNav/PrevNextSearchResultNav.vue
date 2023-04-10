<template>
  <div class="flex justify-between py-1 px-4">
    <Button variant="tertiary">
      <ChevronLeftIcon />
      Previous
    </Button>
    <Button variant="tertiary"> Next <ChevronRightIcon /> </Button>
  </div>
</template>
<script setup lang="ts">
import Button from "@/components/Button/Button.vue";
import { ChevronRightIcon, ChevronLeftIcon } from "@/icons";
import { useAssetStore } from "@/stores/assetStore";
import { useSearchStore } from "@/stores/searchStore";

const assetStore = useAssetStore();
const searchStore = useSearchStore();
</script>
<style scoped></style>
