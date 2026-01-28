<template>
  <AppMenuGroup label="Admin">
    <AppMenuItem :to="`/instances/edit/${instance.id}`">
      Instance Settings
    </AppMenuItem>
    <AppMenuItem :href="`${BASE_URL}/permissions/edit/instance/${instance.id}`">
      Instance Permissions
    </AppMenuItem>
    <AppMenuItem :href="`${BASE_URL}/instances/customPages`">
      Instance Pages
    </AppMenuItem>
    <AppMenuItem :href="`${BASE_URL}/reports`">Reports</AppMenuItem>
    <AppMenuItem :href="`${BASE_URL}/templates`">Edit Templates</AppMenuItem>
    <AppMenuItem :href="`${BASE_URL}/collectionManager`">
      Edit Collections
    </AppMenuItem>
    <AppMenuItem :href="`${BASE_URL}/assetManager/importFromCSV`">
      Import from CSV
    </AppMenuItem>
    <AppMenuItem :href="exportToCSVUrl">Export to CSV</AppMenuItem>
    <template v-if="currentUser.isSuperAdmin">
      <Divider />
      <AppMenuItem :href="`${BASE_URL}/admin`">Super Admin 🦸‍♀️</AppMenuItem>
      <AppMenuItem :href="`${BASE_URL}/admin/logs`">Logs</AppMenuItem>
    </template>
  </AppMenuGroup>
</template>
<script setup lang="ts">
import AppMenuGroup from "./AppMenuGroup.vue";
import AppMenuItem from "./AppMenuItem.vue";
import Divider from "./Divider.vue";
import config from "@/config";
import { ElevatorInstance, User } from "@/types";
import { useSearchStore } from "@/stores/searchStore";
import { computed } from "vue";

defineProps<{
  instance: ElevatorInstance;
  currentUser: User;
}>();

const BASE_URL = config.instance.base.url;

const searchStore = useSearchStore();
const exportToCSVUrl = computed(() => {
  const url = new URL(
    `${BASE_URL}/assetManager/exportCSV`,
    window.location.origin
  );

  // append searchId as hash if it exists
  if (searchStore.searchId) {
    url.hash = searchStore.searchId;
  }
  return url.toString();
});
</script>
<style scoped></style>
