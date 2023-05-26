<template>
  <DropDown
    v-show="themingEnabled && availableThemes.length > 1"
    label="Select Theme"
    :showChevron="false"
  >
    <template #label>
      <ThemeIcon />
    </template>
    <DropDownItem
      v-for="theme in availableThemes"
      :key="theme"
      :current="activeTheme === theme"
      @click="activeTheme = theme"
    >
      {{ capitalize(theme) }}
    </DropDownItem>
  </DropDown>
</template>

<script setup lang="ts">
import ThemeIcon from "@/icons/ThemeIcon.vue";
import DropDown from "../DropDown/DropDown.vue";
import DropDownItem from "../DropDown/DropDownItem.vue";
import { watch } from "vue";
import { useStorage } from "@vueuse/core";
import config from "@/config";

const {
  availableThemes,
  defaultTheme,
  enabled: themingEnabled,
} = config.instance.theming;
const { url: baseUrl } = config.instance.base;
const activeTheme = useStorage(`theme-${baseUrl}`, defaultTheme);

watch(
  activeTheme,
  async () => {
    // if available theme is set to a theme that isn't available, set it to the default theme
    if (!availableThemes.includes(activeTheme.value)) {
      activeTheme.value = defaultTheme;
    }

    // set theme on the body
    document.documentElement.setAttribute("data-theme", activeTheme.value);

    // if the theme is light, we're done
    if (activeTheme.value === "light") return;

    // otherwise load the theme css
    import(`../../css/themes/${activeTheme.value}.css`).catch((err) => {
      console.error(
        `Failed to load theme css for ${activeTheme.value}. falling back to light theme.`,
        err
      );
    });
  },
  { immediate: true }
);

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
</script>
