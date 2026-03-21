<template>
  <DefaultLayout class="all-collections-page">
    <div class="container py-10 mx-auto">
      <div class="flex justify-between items-center">
        <h1 class="text-4xl font-bold my-8">All My Assets</h1>
        <RouterLink :to="{ path: '/assetManager/addAsset' }" asChild>
          <Button variant="primary" class="mb-4">Add Asset</Button>
        </RouterLink>
      </div>
      <Tabs :activeTabId="activeTab" @tabChange="(tab) => setActiveTab(tab.id)">
        <Tab id="my-assets" label="My Assets">
          <p v-if="!isFetching && !allUserAssets.length" class="text-lg">
            No assets found.
          </p>
          <UserAssetsTable
            v-else-if="allUserAssets.length"
            :columns="columns"
            :data="allUserAssets"
            @deleteAsset="handleDeleteAsset" />
        </Tab>
        <Tab id="trash" :label="`Trash (${deletedAssets.length})`">
          <p v-if="!isDeletedFetching && !deletedAssets.length" class="text-lg">
            No deleted assets.
          </p>
          <UserAssetsTable
            v-else-if="deletedAssets.length"
            :columns="trashColumns"
            :data="deletedAssets" />
        </Tab>
      </Tabs>
    </div>
  </DefaultLayout>
</template>
<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import { useAllUserAssets } from "@/queries/useAllUserAssets";
import { useDeletedUserAssets } from "@/queries/useDeletedUserAssets";
import Button from "@/components/Button/Button.vue";
import Tabs from "@/components/Tabs/Tabs.vue";
import Tab from "@/components/Tabs/Tab.vue";
import { createColumns } from "./UserAssetsTableColumns";
import { createDeletedColumns } from "./DeletedAssetsTableColumns";
import UserAssetsTable from "./UserAssetsTable.vue";
import { useDeleteAssetMutation } from "@/queries/useDeleteAssetMutation";
import { useRestoreAssetMutation } from "@/queries/useRestoreAssetMutation";
import { useErrorStore } from "@/stores/errorStore";
import { useToastStore } from "@/stores/toastStore";

const route = useRoute();
const router = useRouter();

const VALID_TABS = ["my-assets", "trash"] as const;
const activeTab = computed(() => {
  const tab = route.query.tab as string;
  return VALID_TABS.includes(tab as (typeof VALID_TABS)[number])
    ? tab
    : "my-assets";
});

const setActiveTab = (tabId: string) => {
  router.replace({ query: tabId === "my-assets" ? {} : { tab: tabId } });
};

const { data: allUserAssets, isFetching } = useAllUserAssets();
const { data: deletedAssets, isFetching: isDeletedFetching } =
  useDeletedUserAssets();

const { mutate: deleteAsset } = useDeleteAssetMutation();
const { mutate: restoreAsset } = useRestoreAssetMutation();
const errorStore = useErrorStore();
const toastStore = useToastStore();

const handleDeleteAsset = (assetId: string) => {
  const asset = allUserAssets.value.find((a) => a.objectId === assetId);
  const label = asset?.title || assetId;
  deleteAsset(assetId, {
    onSuccess: () => {
      toastStore.addToast({
        message: `"${label}" moved to trash.`,
        variant: "success",
        duration: 6000,
        action: {
          label: "Undo",
          handler: () => restoreAsset(assetId),
        },
      });
    },
    onError: (error) => {
      errorStore.setError(
        new Error(`Failed to delete asset: ${error.message}`)
      );
    },
  });
};

const handleRestore = (assetId: string) => {
  const asset = deletedAssets.value.find((a) => a.objectId === assetId);
  const label = asset?.title || assetId;
  restoreAsset(assetId, {
    onSuccess: () => {
      toastStore.addToast({
        message: `"${label}" restored.`,
        variant: "success",
        duration: 6000,
        action: {
          label: "Undo",
          handler: () => deleteAsset(assetId),
        },
      });
    },
  });
};

const columns = createColumns({ onDelete: handleDeleteAsset });
const trashColumns = createDeletedColumns({ onRestore: handleRestore });
</script>
<style scoped></style>
