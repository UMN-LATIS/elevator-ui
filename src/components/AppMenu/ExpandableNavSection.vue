<template>
  <div class="expandable-nav-section">
    <template v-for="item in navItems" :key="item.id">
      <div v-if="!item.children">
        <AppMenuItem :item="item" />
      </div>
      <Disclosure v-else v-slot="{ open }" as="div" class="space-y-1">
        <DisclosureButton
          class="group w-full flex items-center pl-2 pr-1 py-2 text-left font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 my-1 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
        >
          <span class="flex-1">{{ item.name }}</span>
          <ChevronDownIcon
            class="w-5 h-5 text-neutral-400 group-hover:text-neutral-500 transform ease-in-out duration-150"
            :class="{ ' -rotate-90': !open }"
          />
        </DisclosureButton>
        <DisclosurePanel class="space-y-1">
          <template v-for="subItem in item.children" :key="subItem.name">
            <AppMenuItem :item="subItem" class="pl-8" />
          </template>
        </DisclosurePanel>
      </Disclosure>
    </template>
  </div>
</template>
<script setup lang="ts">
import ChevronDownIcon from "@/icons/ChevronDownIcon.vue";
import { NavItem } from "@/types";
import { Disclosure, DisclosureButton, DisclosurePanel } from "@headlessui/vue";
import AppMenuItem from "./AppMenuItem.vue";

defineProps<{
  navItems: NavItem[];
}>();
</script>
<style scoped></style>
