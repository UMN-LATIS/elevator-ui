<template>
  <AppMenuGroup v-if="currentUser?.canManageAssets" label="My Assets">
    <AppMenuItem :href="`${BASE_URL}/assetManager/userAssets/`">
      List Assets
    </AppMenuItem>
    <!-- this goes to the legacy add asset page, so just use a plain form -->
    <form
      action="https://dev.elevator.umn.edu/defaultinstance/assetManager/addAsset"
      method="POST"
      role="form"
    >
      <DropDown
        label="Add Asset"
        class="edit-nav-section__add-asset-dropdown w-full"
        labelClass="flex justify-between pr-0"
        chevronClass="add-asset-dropdown__chevron w-4 h-4 transform -rotate-90 text-neutral-400 transition"
      >
        <DropDownItem disabled="true" class="italic text-neutral-400"
          >Choose a template</DropDownItem
        >
        <DropDownItem
          v-for="template in instanceStore.instance.templates"
          :key="template.id"
        >
          <button type="submit" name="templateId" :value="template.id">
            {{ template.name }}
          </button>
        </DropDownItem>
      </DropDown>
    </form>
    <template v-if="assetId">
      <AppMenuItem :href="`${BASE_URL}/assetManager/editAsset/${assetId}`">
        Edit Asset
      </AppMenuItem>
      <AppMenuItem @click="handleDeleteAssetClick"> Delete Asset </AppMenuItem>
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
import { useInstanceStore } from "@/stores/instanceStore";
import api from "@/api";
import DropDown from "../DropDown/DropDown.vue";
import DropDownItem from "../DropDown/DropDownItem.vue";

const BASE_URL = config.instance.base.url;

const props = defineProps<{
  currentUser: User;
  instance: ElevatorInstance;
  assetId: string | null;
}>();

const instanceStore = useInstanceStore();

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
