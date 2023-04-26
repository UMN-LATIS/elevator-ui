<template>
  <DropDown label="Select Theme" :showChevron="false">
    <template #label>
      <ThemeIcon />
    </template>
    <DropDownItem
      v-for="theme in availableThemes"
      :key="theme.id"
      :current="isCurrentTheme(theme.id)"
      @click="setTheme(theme.id)"
    >
      {{ theme.name }}
    </DropDownItem>
  </DropDown>
</template>

<script setup lang="ts">
import { watch } from "vue";
import ThemeIcon from "@/icons/ThemeIcon.vue";
import { useTheme, type ThemeId } from "./useTheme";
import DropDown from "../DropDown/DropDown.vue";
import DropDownItem from "../DropDown/DropDownItem.vue";

const props = defineProps<{
  defaultTheme: ThemeId;
}>();

const { activeThemeId, availableThemes, effectiveThemeId } = useTheme({
  defaultTheme: props.defaultTheme,
  themes: [{ id: "folwell", name: "Folwell" }],
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
