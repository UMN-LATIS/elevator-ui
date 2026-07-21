<template>
  <div
    v-if="previewTheme"
    ref="barRef"
    class="fixed bottom-0 inset-x-0 z-50 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 bg-inverse-surface text-inverse-on-surface px-4 py-2 border-t border-outline">
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
import { computed, ref, watchEffect, onUnmounted } from "vue";
import { useElementSize } from "@vueuse/core";
import Button from "@/components/Button/Button.vue";
import { useTheming } from "@/helpers/useTheming";
import { prettyThemeName } from "@/helpers/prettyThemeName";
import { ALL_THEMES } from "@/config";

const { previewTheme, startPreview, endPreview } = useTheming();

// Every theme, not just the enabled ones: the point of previewing is
// judging a theme before enabling it.
const themeOptions = computed(() => ALL_THEMES.toSorted());

const barRef = ref<HTMLElement | null>(null);

// Reserve the bar's height at the bottom of the page so it never covers
// content. Measured rather than hard-coded because themes change fonts,
// and with them the bar's height.
const { height: barHeight } = useElementSize(
  barRef,
  { width: 0, height: 0 },
  { box: "border-box" }
);
watchEffect(() => {
  document.body.style.paddingBottom =
    previewTheme.value && barHeight.value ? `${barHeight.value}px` : "";
});
onUnmounted(() => {
  document.body.style.paddingBottom = "";
});

function handleThemeChange(event: Event): void {
  const select = event.target as HTMLSelectElement;
  startPreview(select.value);
}
</script>
