<template>
  <div
    v-if="previewTheme"
    class="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-full bg-inverse-surface text-inverse-on-surface pl-4 pr-2 py-2 shadow-lg">
    <label for="theme-preview-select" class="text-sm">Previewing</label>
    <select
      id="theme-preview-select"
      :value="previewTheme"
      class="rounded-md border border-outline bg-inverse-surface text-inverse-on-surface text-sm py-1"
      @change="handleThemeChange">
      <option v-for="theme in themeOptions" :key="theme" :value="theme">
        {{ prettyThemeName(theme) }}
      </option>
    </select>
    <RouterLink
      v-if="settingsRoute"
      :to="settingsRoute"
      class="text-sm underline">
      Theme settings
    </RouterLink>
    <Button
      variant="secondary"
      type="button"
      class="py-1 px-3 text-sm"
      @click="endPreview">
      Revert
    </Button>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import Button from "@/components/Button/Button.vue";
import { useTheming } from "@/helpers/useTheming";
import { prettyThemeName } from "@/helpers/prettyThemeName";
import { ALL_THEMES } from "@/config";

const { previewTheme, previewInstanceId, startPreview, endPreview } =
  useTheming();

// Every theme, not just the enabled ones: the point of previewing is
// judging a theme before enabling it.
const themeOptions = computed(() => ALL_THEMES.toSorted());

const settingsRoute = computed(() => {
  if (previewInstanceId.value === null) return null;
  return {
    name: "editInstanceSettingsPage",
    params: { instanceId: previewInstanceId.value },
    hash: "#user-interface",
  };
});

function handleThemeChange(event: Event): void {
  const select = event.target as HTMLSelectElement;
  if (previewInstanceId.value === null) return;
  startPreview(select.value, previewInstanceId.value);
}
</script>
