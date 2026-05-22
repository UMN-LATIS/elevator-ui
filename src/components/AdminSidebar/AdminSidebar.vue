<template>
  <nav class="admin-sidebar" aria-label="Admin">
    <h2
      class="text-xs uppercase text-on-surface-variant font-bold pl-2 pb-1 tracking-wider">
      Admin
    </h2>
    <ul class="admin-sidebar__list">
      <li>
        <AppNavItem :to="{ name: 'customPagesIndex' }" :icon="FileTextIcon">
          Pages
        </AppNavItem>
      </li>
      <!-- <li>
        <AppNavItem :to="{ name: 'adminGroups' }" :icon="UsersIcon">
          Groups
        </AppNavItem>
      </li> -->
      <li v-if="config.features.adminPermissions">
        <AppNavItem :to="{ name: 'adminPermissions' }" :icon="LockIcon">
          Permissions
        </AppNavItem>
      </li>
      <li>
        <AppNavItem :to="{ name: 'templatesIndex' }" :icon="LayoutTemplateIcon">
          Templates
        </AppNavItem>
      </li>
      <li>
        <AppNavItem
          :href="`${BASE_URL}/collectionManager`"
          :icon="FolderCogIcon">
          Collections
        </AppNavItem>
      </li>
      <li>
        <AppNavItem :href="`${BASE_URL}/reports`" :icon="BarChartIcon">
          Reports
        </AppNavItem>
      </li>
      <li>
        <AppNavItem
          :to="{
            name: 'editInstanceSettingsPage',
            params: { instanceId: instanceStore.instance.id },
          }"
          :icon="SettingsIcon">
          Instance Settings
        </AppNavItem>
      </li>
      <li v-if="currentUser?.isSuperAdmin">
        <AppNavItem :href="`${BASE_URL}/admin`" :icon="ShieldIcon">
          Super Admin
        </AppNavItem>
      </li>
      <li v-if="currentUser?.isSuperAdmin">
        <AppNavItem :href="`${BASE_URL}/admin/logs`" :icon="ScrollTextIcon">
          Logs
        </AppNavItem>
      </li>
    </ul>
  </nav>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import {
  FileText as FileTextIcon,
  Users as UsersIcon,
  Lock as LockIcon,
  LayoutTemplate as LayoutTemplateIcon,
  FolderCog as FolderCogIcon,
  BarChart3 as BarChartIcon,
  Settings as SettingsIcon,
  ScrollText as ScrollTextIcon,
  Shield as ShieldIcon,
} from "lucide-vue-next";
import AppNavItem from "@/components/AppMenu/AppNavItem.vue";
import { useInstanceStore } from "@/stores/instanceStore";
import config from "@/config";

const BASE_URL = config.instance.base.url;
const instanceStore = useInstanceStore();
const { currentUser } = storeToRefs(instanceStore);
</script>

<style scoped>
.admin-sidebar {
  background: var(--surface);
  color: var(--on-surface);
  border-right: 1px solid var(--outline-variant);
  padding: 1rem 0.75rem;
  height: 100%;
  width: 15rem;
}

.admin-sidebar__list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
</style>
