<template>
  <nav v-if="items.length">
    <ul class="flex gap-4 items-center">
      <li v-for="menuItem in items" :key="menuItem.name">
        <MenuAccordion v-if="menuItem.children" :label="menuItem.name">
          <ul
            class="absolute flex flex-col gap-2 w-48 bg-neutral-50 p-4 shadow rounded top-full mt-2 left-0"
          >
            <ChildMenuItem
              v-for="(child, i) in menuItem.children"
              :key="i"
              :item="child"
            />
          </ul>
        </MenuAccordion>
        <a v-else :href="menuItem.href" class="text-current">{{
          menuItem.name
        }}</a>
      </li>
    </ul>
  </nav>
</template>
<script setup lang="ts">
import MenuAccordion from "./MenuAccordion.vue";
import ChildMenuItem from "./ChildMenuItem.vue";
import { MenuItemWithOptionalChildren } from "@/types";

defineProps<{
  items: MenuItemWithOptionalChildren[];
}>();
</script>
<style scoped></style>
