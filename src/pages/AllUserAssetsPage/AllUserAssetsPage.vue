<template>
  <DefaultLayout class="all-collections-page">
    <div class="container py-10 mx-auto">
      <div class="flex justify-between items-center">
        <h1 class="text-4xl font-bold my-8">All My Assets</h1>
        <RouterLink :to="{ name: 'addAsset' }" asChild>
          <Button variant="primary" class="mb-4">Add Asset</Button>
        </RouterLink>
      </div>
      <p v-if="!allUserAssets.length" class="text-lg">No assets found.</p>
      <UserAssetsTable v-else :columns="columns" :data="allUserAssets" />
    </div>
  </DefaultLayout>
</template>
<script setup lang="ts">
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import { useAllUserAssets } from "@/queries/useAllUserAssets";
import Button from "@/components/Button/Button.vue";
import { columns } from "./UserAssetsTableColumns";
import UserAssetsTable from "./UserAssetsTable.vue";
const { data: allUserAssets } = useAllUserAssets();
</script>
<style scoped></style>
