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
            :defaultSort="{ id: 'modifiedDate_date', desc: true }"
            @deleteAsset="handleDeleteAsset" />
        </Tab>
        <Tab id="trash" :label="`Trash (${deletedAssets.length})`">
          <p v-if="!isDeletedFetching && !deletedAssets.length" class="text-lg">
            No deleted assets.
          </p>
          <UserAssetsTable
            v-else-if="deletedAssets.length"
            :columns="trashColumns"
            :data="deletedAssets"
            :defaultSort="{ id: 'deletedAt', desc: true }" />
        </Tab>
      </Tabs>
    </div>
    <ConfirmModal
      :isOpen="showDeleteConfirm"
      title="Move to Trash?"
      type="warning"
      confirmLabel="Move to Trash"
      @confirm="confirmDelete"
      @close="showDeleteConfirm = false">
      Deleting an asset moves it to the trash. Restoring it later will require
      regenerating derivatives, which may take some time.
    </ConfirmModal>
  </DefaultLayout>
</template>
<script setup lang="ts">
import { computed, ref } from "vue";
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
import ConfirmModal from "@/components/ConfirmModal/ConfirmModal.vue";

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
  const { tab: _tab, ...rest } = route.query;
  router.replace({
    query: tabId === "my-assets" ? rest : { ...rest, tab: tabId },
  });
};

const { data: allUserAssets, isFetching } = useAllUserAssets();
const { data: deletedAssets, isFetching: isDeletedFetching } =
  useDeletedUserAssets();

const { mutate: deleteAsset } = useDeleteAssetMutation();
const { mutate: restoreAsset } = useRestoreAssetMutation();

// Show the delete confirmation dialog once per session, then skip it.
const hasConfirmedDelete = ref(false);
const showDeleteConfirm = ref(false);
const pendingDeleteId = ref<string | null>(null);

const performDelete = (assetId: string) => {
  deleteAsset(assetId);
};

const handleDeleteAsset = (assetId: string) => {
  if (hasConfirmedDelete.value) {
    performDelete(assetId);
    return;
  }
  pendingDeleteId.value = assetId;
  showDeleteConfirm.value = true;
};

const confirmDelete = () => {
  hasConfirmedDelete.value = true;
  if (pendingDeleteId.value) {
    performDelete(pendingDeleteId.value);
    pendingDeleteId.value = null;
  }
};

const handleRestore = (assetId: string) => {
  restoreAsset(assetId);
};

const columns = createColumns({ onDelete: handleDeleteAsset });
const trashColumns = createDeletedColumns({ onRestore: handleRestore });
</script>
<style scoped></style>
