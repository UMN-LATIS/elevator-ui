<template>
  <div class="expandable-nav-section">
    <template v-for="item in navItems" :key="item.id">
      <div v-if="!item.children">
        <AppMenuItem :href="item.href" :isCurrentPage="item.isCurrentPage">{{
          item.name
        }}</AppMenuItem>
      </div>
      <AppMenuGroup v-else :label="item.name">
        <template v-for="subItem in item.children" :key="subItem.name">
          <AppMenuItem
            :href="subItem.href"
            :isCurrentPage="subItem.isCurrentPage"
          >
            {{ subItem.name }}
          </AppMenuItem>
        </template>
      </AppMenuGroup>
    </template>
  </div>
</template>
<script setup lang="ts">
import { NavItem } from "@/types";
import AppMenuGroup from "./AppMenuGroup.vue";
import AppMenuItem from "./AppMenuItem.vue";

defineProps<{
  navItems: NavItem[];
}>();
</script>
<style scoped></style>
