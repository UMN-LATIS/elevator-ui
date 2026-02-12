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
        class="dropdown__menu-button inline-flex w-full justify-center rounded-md items-center focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-surface p-2"
        :class="labelClass"
        @click="(event) => emit('trigger:click', event)">
        <slot name="label">
          {{ label }}
        </slot>
        <ChevronDownIcon
          v-if="showChevron"
          :class="['xl:block m-1', chevronClass]"
          aria-hidden="true" />
      </MenuButton>
      <MenuItems
        class="w-64 divide-y divide-outline-variant rounded-md bg-surface-container text-on-surface shadow-lg ring-1 ring-outline-variant focus:outline-none max-h-[50vh] overflow-y-auto">
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
    label?: string;
    alignment?: "left" | "right";
    showChevron?: boolean;
    labelClass?: string | string[] | Record<string, boolean>;
    chevronClass?: string | string[] | Record<string, boolean>;
  }>(),
  {
    label: "Options",
    alignment: "right",
    showChevron: true,
    labelClass: "",
    chevronClass: "",
  }
);

const emit = defineEmits<{
  (eventName: "trigger:click", event: MouseEvent): void;
}>();
</script>
