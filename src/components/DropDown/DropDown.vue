<template>
  <Menu as="div" class="inline-block text-left">
    <Float
      :placement="alignment === 'left' ? 'bottom-start' : 'bottom-end'"
      shift
      :offset="4"
      zIndex="99"
      enterActiveClass="transition ease-out duration-100"
      enterFromClass="transform opacity-0 scale-95"
      enterToClass="transform opacity-100 scale-100"
      leaveActiveClass="transition ease-in duration-75"
      leaveFromClass="transform opacity-100 scale-100"
      leaveToClass="transform opacity-0 scale-95"
    >
      <MenuButton
        class="inline-flex w-full justify-center rounded-md items-center focus:outline-none focus:ring-2 p-2 placeholder:focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-100"
        :class="labelClass"
      >
        <slot name="label">
          {{ label }}
        </slot>
        <ChevronDownIcon
          v-if="showChevron"
          :class="['xl:block m-1', chevronClass]"
          aria-hidden="true"
        />
      </MenuButton>

      <!-- <transition
        enterActiveClass="transition ease-out duration-100"
        enterFromClass="transform opacity-0 scale-95"
        enterToClass="transform opacity-100 scale-100"
        leaveActiveClass="transition ease-in duration-75"
        leaveFromClass="transform opacity-100 scale-100"
        leaveToClass="transform opacity-0 scale-95"
      > -->
      <MenuItems
        class="w-64 divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
      >
        <slot name="header" />
        <div class="py-1">
          <slot />
        </div>
        <slot name="footer" />
      </MenuItems>
      <!-- </transition> -->
    </Float>
  </Menu>
</template>

<script setup lang="ts">
import { Menu, MenuButton, MenuItems } from "@headlessui/vue";
import ChevronDownIcon from "@/icons/ChevronDownIcon.vue";
import { Float } from "@headlessui-float/vue";

withDefaults(
  defineProps<{
    label: string;
    alignment?: "left" | "right";
    showChevron?: boolean;
    labelClass?: string | string[] | Record<string, boolean>;
    chevronClass?: string | string[] | Record<string, boolean>;
  }>(),
  {
    alignment: "right",
    showChevron: true,
    labelClass: "",
  }
);
</script>
