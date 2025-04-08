<template>
  <AppMenuGroup v-if="currentUser?.canManageAssets" label="Manage Assets">
    <AppMenuItem :href="`${BASE_URL}/assetManager/userAssets/`">
      All My Assets
    </AppMenuItem>
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
import api from "@/api";

const BASE_URL = config.instance.base.url;

const props = defineProps<{
  currentUser: User;
  instance: ElevatorInstance;
  assetId: string | null;
}>();

async function handleDeleteAssetClick() {
  if (!props.assetId) {
    throw new Error(`assetId is null. Cannot delete asset.`);
  }

  if (
    !confirm("Are you sure you want to delete this asset and all derivatives")
  ) {
    return;
  }

  try {
    await api.deleteAsset(props.assetId);
    window.location.href = `${BASE_URL}/assetManager/userAssets`;
  } catch (error) {
    console.error(error);
    alert("Error deleting asset.");
  }
}
</script>
<style>
.edit-nav-section__add-asset-dropdown[data-headlessui-state="open"]
  .add-asset-dropdown__chevron {
  transform: rotate(0deg);
}
</style>
