<template>
  <DropDown
    v-show="isThemingEnabled && availableThemes.length > 1"
    label="Select Theme"
    :showChevron="false"
    class="theme-selector">
    <template #label>
      <ThemeIcon />
    </template>
    <DropDownItem
      v-for="theme in availableThemes"
      :key="theme"
      :current="activeTheme === theme"
      @click="setTheme(theme)">
      {{ capitalize(theme) }}
    </DropDownItem>
  </DropDown>
</template>

<script setup lang="ts">
import ThemeIcon from "@/icons/ThemeIcon.vue";
import DropDown from "../DropDown/DropDown.vue";
import DropDownItem from "../DropDown/DropDownItem.vue";
import { useTheming } from "@/helpers/useTheming";

const {
  activeTheme,
  availableThemes,
  setTheme,
  isEnabled: isThemingEnabled,
} = useTheming();

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
</script>
