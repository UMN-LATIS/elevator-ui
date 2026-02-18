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
        class="edit-nav-section__delete-asset"
        @click="handleDeleteAssetClick">
        Delete Asset
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
import { useRoute, useRouter } from "vue-router";
import { useDeleteAssetMutation } from "@/queries/useDeleteAssetMutation";
import { useErrorStore } from "@/stores/errorStore";
import { computed } from "vue";
import { usePageAssetId } from "@/composables/usePageAssetId";

const BASE_URL = config.instance.base.url;

const props = defineProps<{
  currentUser: User;
  instance: ElevatorInstance;
  assetId: string | null;
}>();

const pageAssetId = usePageAssetId();
const activeAssetId = computed(
  () => props.assetId ?? pageAssetId?.value ?? null
);

const router = useRouter();
const { mutate: deleteAsset } = useDeleteAssetMutation();
const errorStore = useErrorStore();

async function handleDeleteAssetClick() {
  if (!activeAssetId.value) {
    throw new Error(`assetId is null. Cannot delete asset.`);
  }

  if (
    !confirm("Are you sure you want to delete this asset and all derivatives")
  ) {
    return;
  }

  deleteAsset(activeAssetId.value, {
    onSuccess: () => {
      router.push("/assetManager/userAssets");
    },
    onError: (error) => {
      console.error("Error deleting asset:", error);
      errorStore.setError(new Error(`Error deleting asset: ${error.message}`));
    },
  });
}

const route = useRoute();
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
