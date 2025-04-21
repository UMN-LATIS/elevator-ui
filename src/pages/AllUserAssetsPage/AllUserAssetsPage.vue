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
      <UserAssetsTable
        v-else
        :columns="columns"
        :data="allUserAssets"
        @deleteAsset="deleteAsset" />
    </div>
  </DefaultLayout>
</template>
<script setup lang="ts">
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import { useAllUserAssets } from "@/queries/useAllUserAssets";
import Button from "@/components/Button/Button.vue";
import { createColumns } from "./UserAssetsTableColumns";
import UserAssetsTable from "./UserAssetsTable.vue";
import { useDeleteAssetMutation } from "@/queries/useDeleteAssetMutation";
import { useErrorStore } from "@/stores/errorStore";

const { data: allUserAssets } = useAllUserAssets();

const { mutate: deleteAsset } = useDeleteAssetMutation();
const errorStore = useErrorStore();

const handleDeleteAsset = (assetId: string) => {
  const confirmDelete = confirm(
    "Are you sure you want to delete this asset? This action cannot be undone."
  );
  if (!confirmDelete) return;
  deleteAsset(assetId, {
    onSuccess: () => {
      // TODO: toast success
    },
    onError: (error) => {
      errorStore.setError(
        new Error(`Failed to delete asset: ${error.message}`)
      );
    },
  });
};

const columns = createColumns({ onDelete: handleDeleteAsset });
</script>
<style scoped></style>
