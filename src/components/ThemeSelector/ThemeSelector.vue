<template>
  <DropDown label="Select Theme" :showChevron="false">
    <template #label>
      <ThemeIcon />
    </template>
    <DropDownItem
      v-for="theme in availableThemes"
      :key="theme"
      :current="activeThemeId === theme"
      @click="activeThemeId = theme"
    >
      {{ capitalize(theme) }}
    </DropDownItem>
  </DropDown>
</template>

<script setup lang="ts">
import { watch } from "vue";
import ThemeIcon from "@/icons/ThemeIcon.vue";
import { useTheme, type Theme } from "./useTheme";
import DropDown from "../DropDown/DropDown.vue";
import DropDownItem from "../DropDown/DropDownItem.vue";
import config from "@/config";

const props = defineProps<{
  defaultTheme: Theme;
}>();

const { activeThemeId, availableThemes, effectiveThemeId } = useTheme({
  defaultTheme: props.defaultTheme,
  themes: config.instance.theming.availableThemes,
});

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
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
