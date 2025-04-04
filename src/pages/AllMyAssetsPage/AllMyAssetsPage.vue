<template>
  <DefaultLayout class="all-collections-page">
    <div class="p-8 px-4">
      <h1 class="text-4xl font-bold my-8">All My Assets</h1>
      {{ isLoading }}
      <div v-if="isLoading" class="text-center">
        <p class="text-lg">Loading...</p>
      </div>
      <div v-else>
        <p class="text-lg">All My Assets</p>
        <div v-if="allUserAssets?.length === 0" class="text-center">
          <p class="text-lg">No assets found.</p>
        </div>
        <div v-else>
          {{ allUserAssets }}
        </div>
      </div>
    </div>
  </DefaultLayout>
</template>
<script setup lang="ts">
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import { useAllUserAssets } from "@/queries/useAllUserAssets";

const { data: allUserAssets, isLoading } = useAllUserAssets();
</script>
<style scoped></style>
