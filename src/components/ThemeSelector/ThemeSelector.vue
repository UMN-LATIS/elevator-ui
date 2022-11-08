<template>
  <Menu as="div" class="relative inline-block text-left">
    <div>
      <MenuButton
        class="inline-flex w-full justify-center items-center rounded-md gap-2 px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-100"
      >
        <h2 class="text-xs uppercase font-medium">Theme</h2>
        <span>{{ activeThemeName ?? "-" }}</span>
        <ChevronDownIcon class="-mr-1 ml-2 h-5 w-5" aria-hidden="true" />
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
        class="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
      >
        <div class="py-1">
          <MenuItem
            v-for="theme in availableThemes"
            v-slot="{ active }"
            :key="theme.id"
          >
            <button
              :class="[
                active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                'block px-4 py-2 text-sm w-full text-left',
              ]"
              @click="setTheme(theme.id)"
            >
              {{ theme.name }}
            </button>
          </MenuItem>
        </div>
      </MenuItems>
    </transition>
  </Menu>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/vue";
import ChevronDownIcon from "@/icons/ChevronDownIcon.vue";
import { useTheme, type ThemeId } from "./useTheme";

const { activeThemeId, availableThemes } = useTheme();
const activeThemeName = computed(() => {
  const theme = availableThemes.value.find(
    (theme) => theme.id === activeThemeId.value
  );
  return theme?.name;
});

function setTheme(themeId: ThemeId) {
  console.log(themeId);
  activeThemeId.value = themeId;
}
</script>
