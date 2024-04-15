<template>
  <AppMenuGroup label="Admin">
    <AppMenuItem :href="`${BASE_URL}/instances/edit/${instance.id}`">
      Instance Settings
    </AppMenuItem>
    <AppMenuItem :href="`${BASE_URL}/permissions/edit/instance/${instance.id}`">
      Instance Permissions
    </AppMenuItem>
    <AppMenuItem :href="`${BASE_URL}/instances/customPages`">
      Instance Pages
    </AppMenuItem>
    <AppMenuItem :href="`${BASE_URL}/reports`"> Reports </AppMenuItem>
    <AppMenuItem :href="`${BASE_URL}/templates`"> Edit Templates </AppMenuItem>
    <AppMenuItem :href="`${BASE_URL}/collectionManager`">
      Edit Collections
    </AppMenuItem>
    <AppMenuItem :href="`${BASE_URL}/assetManager/importFromCSV`">
      Import from CSV
    </AppMenuItem>
    <AppMenuItem :href="`${BASE_URL}/assetManager/exportCSV`">
      Export to CSV
    </AppMenuItem>
    <template v-if="currentUser.isSuperAdmin">
      <Divider />
      <AppMenuItem :href="`${BASE_URL}/admin`"> Super Admin 🦸‍♀️ </AppMenuItem>
      <AppMenuItem :href="`${BASE_URL}/admin/logs`"> Logs </AppMenuItem>
    </template>
  </AppMenuGroup>
</template>
<script setup lang="ts">
import AppMenuGroup from "./AppMenuGroup.vue";
import AppMenuItem from "./AppMenuItem.vue";
import Divider from "./Divider.vue";
import config from "@/config";
import { ElevatorInstance, User } from "@/types";

defineProps<{
  instance: ElevatorInstance;
  currentUser: User;
}>();

const BASE_URL = config.instance.base.url;
</script>
<style scoped></style>
