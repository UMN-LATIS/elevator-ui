<template>
  <AppMenuGroup v-if="currentUser?.canManageAssets" label="Edit">
    <AppMenuItem :href="`${BASE_URL}/assetManager/addAssetModal`">
      Add Asset
    </AppMenuItem>
    <AppMenuItem :href="`${BASE_URL}/assetManager/editAsset/${assetId}`">
      Edit Asset
    </AppMenuItem>
    <AppMenuItem :href="`${BASE_URL}/assetManager/deleteAsset/${assetId}`">
      Delete Asset
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

const BASE_URL = config.instance.base.url;

defineProps<{
  currentUser: User;
  instance: ElevatorInstance;
  assetId: string;
}>();
</script>
<style scoped></style>
