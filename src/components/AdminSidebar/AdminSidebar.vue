<template>
  <nav
    class="bg-surface text-on-surface border-r border-outline-variant h-full w-60 py-4 px-3"
    aria-label="Admin">
    <h2
      class="text-xs uppercase text-on-surface-variant font-bold pl-2 pb-1 tracking-wider">
      Admin
    </h2>
    <ul class="list-none p-0 m-0 flex flex-col gap-0.5">
      <li>
        <SidebarNavItem :to="{ name: 'customPagesIndex' }" :icon="FileTextIcon">
          Pages
        </SidebarNavItem>
      </li>
      <li>
        <SidebarNavItem :to="{ name: 'adminPermissions' }" :icon="LockIcon">
          Permissions
        </SidebarNavItem>
      </li>
      <li>
        <SidebarNavItem
          :to="{ name: 'templatesIndex' }"
          :icon="LayoutTemplateIcon">
          Templates
        </SidebarNavItem>
      </li>
      <li>
        <SidebarNavItem
          :href="`${BASE_URL}/collectionManager`"
          :icon="FolderCogIcon">
          Collections
        </SidebarNavItem>
      </li>
      <li>
        <SidebarNavItem :href="`${BASE_URL}/reports`" :icon="BarChartIcon">
          Reports
        </SidebarNavItem>
      </li>
      <li>
        <SidebarNavItem
          :to="{
            name: 'editInstanceSettingsPage',
            params: { instanceId: instanceStore.instance.id },
          }"
          :icon="SettingsIcon">
          Instance Settings
        </SidebarNavItem>
      </li>
      <li v-if="currentUser?.isSuperAdmin">
        <SidebarNavItem :href="`${BASE_URL}/admin`" :icon="ShieldIcon">
          Super Admin
        </SidebarNavItem>
      </li>
      <li v-if="currentUser?.isSuperAdmin">
        <SidebarNavItem :href="`${BASE_URL}/admin/logs`" :icon="ScrollTextIcon">
          Logs
        </SidebarNavItem>
      </li>
    </ul>
  </nav>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import {
  FileText as FileTextIcon,
  Lock as LockIcon,
  LayoutTemplate as LayoutTemplateIcon,
  FolderCog as FolderCogIcon,
  BarChart3 as BarChartIcon,
  Settings as SettingsIcon,
  ScrollText as ScrollTextIcon,
  Shield as ShieldIcon,
} from "lucide-vue-next";
import SidebarNavItem from "./SidebarNavItem.vue";
import { useInstanceStore } from "@/stores/instanceStore";
import config from "@/config";

const BASE_URL = config.instance.base.url;
const instanceStore = useInstanceStore();
const { currentUser } = storeToRefs(instanceStore);
</script>
