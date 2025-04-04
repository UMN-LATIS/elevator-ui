<template>
  <DefaultLayout>
    <div class="container py-10 mx-auto">
      <h1 class="text-2xl font-bold">Edit Asset</h1>
      {{ assetId }}
      <!-- <AssetForm :asset="asset" /> -->
    </div>
  </DefaultLayout>
</template>
<script setup lang="ts">
import DefaultLayout from "@/layouts/DefaultLayout.vue";

defineProps<{
  assetId: string;
}>();
</script>
<style scoped></style>
