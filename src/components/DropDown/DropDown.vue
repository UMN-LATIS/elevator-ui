<template>
  <Menu as="div" class="dropdown inline-block text-left">
    <Float
      :placement="alignment === 'left' ? 'bottom-start' : 'bottom-end'"
      shift
      flip
      zIndex="99"
      :offset="4"
      enter="transition ease-out duration-100"
      enterFrom="transform opacity-0 scale-95"
      enterTo="transform opacity-100 scale-100"
      leave="transition ease-in duration-75"
      leaveFrom="transform opacity-100 scale-100"
      leaveTo="transform opacity-0 scale-95"
      tailwindcssOriginClass>
      <MenuButton
        class="inline-flex w-full justify-center rounded-md items-center focus:outline-none focus:ring-2 p-2 placeholder:focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-100"
        :class="labelClass">
        <slot name="label">
          {{ label }}
        </slot>
        <ChevronDownIcon
          v-if="showChevron"
          :class="['xl:block m-1', chevronClass]"
          aria-hidden="true" />
      </MenuButton>
      <MenuItems
        class="w-64 divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none max-h-[50vh] overflow-y-auto">
        <slot name="header" />
        <div class="py-1">
          <slot />
        </div>
        <slot name="footer" />
      </MenuItems>
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
