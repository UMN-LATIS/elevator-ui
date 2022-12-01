<template>
  <Menu as="div" class="relative inline-block text-left">
    <div>
      <MenuButton
        class="inline-flex w-full justify-center rounded-md items-center focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-100"
      >
        <slot name="label">
          {{ label }}
        </slot>
        <ChevronDownIcon class="h-4 w-4 m-1" aria-hidden="true" />
      </MenuButton>
    </div>

    <transition
      enterActiveClass="transition ease-out duration-100"
      enterFromClass="transform opacity-0 scale-95"
      enterToClass="transform opacity-100 scale-100"
      leaveActiveClass="transition ease-in duration-75"
      leaveFromClass="transform opacity-100 scale-100"
      leaveToClass="transform opacity-0 scale-95"
    >
      <MenuItems
        class="absolute right-0 z-10 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
      >
        <slot name="header" />
        <div class="py-1">
          <slot />
        </div>
        <slot name="footer" />
      </MenuItems>
    </transition>
  </Menu>
</template>

<script setup lang="ts">
import { Menu, MenuButton, MenuItems } from "@headlessui/vue";
import ChevronDownIcon from "@/icons/ChevronDownIcon.vue";

defineProps<{
  label: string;
}>();
</script>
