<template>
  <AppMenuGroup v-if="currentUser?.canManageAssets" label="Edit">
    <AppMenuItem :href="`${BASE_URL}/assetManager/addAssetModal`">
      Add Asset
    </AppMenuItem>
    <AppMenuItem :href="`${BASE_URL}/assetManager/editAsset/${assetId}`">
      Edit Asset
    </AppMenuItem>
    <AppMenuItem @click="handleDeleteAssetClick"> Delete Asset </AppMenuItem>
    <AppMenuItem :href="`${BASE_URL}/assetManager/restoreAsset/${assetId}`">
      Restore Asset
    </AppMenuItem>
    <Divider />
    <AppMenuItem :href="`${BASE_URL}/assetManager/userAssets/`">
      All My Assets
    </AppMenuItem>
  </AppMenuGroup>
</template>
<script setup lang="ts">
import AppMenuGroup from "./AppMenuGroup.vue";
import AppMenuItem from "./AppMenuItem.vue";
import Divider from "./Divider.vue";
import config from "@/config";
import { ElevatorInstance, User } from "@/types";
import api from "@/helpers/api";

const BASE_URL = config.instance.base.url;

const props = defineProps<{
  currentUser: User;
  instance: ElevatorInstance;
  assetId: string;
}>();

async function handleDeleteAssetClick() {
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
<style scoped></style>
