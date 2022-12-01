<template>
  <Menu as="div" class="relative inline-block text-left">
    <div>
      <MenuButton
        class="inline-flex w-full justify-center items-center rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-100"
      >
        <span>Theme</span>
        <ChevronDownIcon class="h-4 w-4" aria-hidden="true" />
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
                active ? 'bg-blue-100 text-neutral-900' : 'text-neutral-700',
                'block px-4 py-2 text-sm w-full text-left',
                isCurrentTheme(theme.id) &&
                  'bg-amber-100 border-l-2 border-neutral-900 font-bold',
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
import { watch } from "vue";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/vue";
import ChevronDownIcon from "@/icons/ChevronDownIcon.vue";
import { useTheme, type ThemeId } from "./useTheme";

const { activeThemeId, availableThemes, effectiveThemeId } = useTheme({
  themes: [
    { id: "hotdog", name: "Hot Dog" },
    { id: "folwell", name: "Folwell" },
  ],
});

function isCurrentTheme(themeId: ThemeId) {
  return themeId === activeThemeId.value;
}

function setTheme(themeId: ThemeId) {
  activeThemeId.value = themeId;
}

// load theme css dynamically
watch(
  activeThemeId,
  async () => {
    // light is the default, so we don't need to load any css
    if (activeThemeId.value === "light") return;

    // dyanmically load the css file
    // we do this because we might need to also load fonts
    // in the theme css
    import(`../../css/themes/${effectiveThemeId.value}.css`);
  },
  { immediate: true }
);
</script>
