<template>
  <AppMenuGroup v-if="currentUser?.canManageAssets" label="Manage Assets">
    <AppMenuItem
      to="/assetManager/userAssets/"
      class="edit-nav-section__all-my-assets">
      All My Assets
    </AppMenuItem>
    <AppMenuItem
      to="/assetManager/addAsset"
      class="edit-nav-section__add-asset">
      Add Asset
    </AppMenuItem>
    <template v-if="activeAssetId">
      <AppMenuItem
        v-if="!isAssetEditPage"
        :to="`/assetManager/editAsset/${activeAssetId}`"
        class="edit-nav-section__edit-asset">
        Edit Asset
      </AppMenuItem>
      <AppMenuItem
        :href="`${BASE_URL}/assetManager/restoreAsset/${activeAssetId}`"
        class="edit-nav-section__restore-asset">
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
import { useRoute } from "vue-router";
import { computed } from "vue";

const BASE_URL = config.instance.base.url;

defineProps<{
  currentUser: User;
  instance: ElevatorInstance;
}>();

const route = useRoute();
const activeAssetId = computed(() => {
  const { assetId } = route.params;
  return typeof assetId === "string" ? assetId : null;
});

const isAssetEditPage = computed(() => {
  return route.path.includes("/assetManager/editAsset/");
});
</script>
<style>
.edit-nav-section__add-asset-dropdown[data-headlessui-state="open"]
  .add-asset-dropdown__chevron {
  transform: rotate(0deg);
}
</style>
