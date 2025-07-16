<template>
  <AppMenuGroup v-if="currentUser?.canManageAssets" label="Manage Assets">
    <AppMenuItem to="/assetManager/userAssets/">All My Assets</AppMenuItem>
    <AppMenuItem to="/assetManager/addAsset">Add Asset</AppMenuItem>
    <template v-if="assetId">
      <AppMenuItem :to="`/assetManager/editAsset/${assetId}`">
        Edit Asset
      </AppMenuItem>
      <AppMenuItem @click="handleDeleteAssetClick">Delete Asset</AppMenuItem>
      <AppMenuItem :href="`${BASE_URL}/assetManager/restoreAsset/${assetId}`">
        Restore Asset
      </AppMenuItem>
      <Divider />
    </template>
  </AppMenuGroup>
</template>
<script setup lang="ts">
import AppMenuGroup from "./AppMenuGroup.vue";
import AppMenuItem from "./AppMenuItem.vue";
import Divider from "./Divider.vue";
import config from "@/config";
import { ElevatorInstance, User } from "@/types";
import { useRouter } from "vue-router";
import { useDeleteAssetMutation } from "@/queries/useDeleteAssetMutation";
import { useErrorStore } from "@/stores/errorStore";

const BASE_URL = config.instance.base.url;

const props = defineProps<{
  currentUser: User;
  instance: ElevatorInstance;
  assetId: string | null;
}>();

const router = useRouter();
const { mutate: deleteAsset } = useDeleteAssetMutation();
const errorStore = useErrorStore();

async function handleDeleteAssetClick() {
  if (!props.assetId) {
    throw new Error(`assetId is null. Cannot delete asset.`);
  }

  if (
    !confirm("Are you sure you want to delete this asset and all derivatives")
  ) {
    return;
  }

  deleteAsset(props.assetId, {
    onSuccess: () => {
      router.push("/assetManager/userAssets");
    },
    onError: (error) => {
      console.error("Error deleting asset:", error);
      errorStore.setError(new Error(`Error deleting asset: ${error.message}`));
    },
  });
}
</script>
<style>
.edit-nav-section__add-asset-dropdown[data-headlessui-state="open"]
  .add-asset-dropdown__chevron {
  transform: rotate(0deg);
}
</style>
