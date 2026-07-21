<template>
  <div
    class="flex items-center gap-2 text-sm rounded-lg"
    :class="{ 'ring-2 ring-primary': isPreviewing }">
    <label class="flex flex-1 min-w-0 items-center gap-2">
      <input
        type="checkbox"
        :checked="isAvailable"
        class="shrink-0 rounded border-outline text-primary focus:ring-m3-primary"
        @change="$emit('toggleAvailable')" />
      <!-- The swatch scope: everything inside renders in the theme's own
           colors and display font. Controls stay outside so they keep the
           app theme and stay legible on every swatch. -->
      <span
        :data-theme="theme"
        class="flex flex-1 min-w-0 items-center gap-2 rounded-lg border border-outline bg-surface text-on-surface px-3 py-2">
        <span class="truncate [font-family:var(--font-display)]">
          {{ prettyThemeName(theme) }}
        </span>
        <span aria-hidden="true" class="ml-auto flex shrink-0 gap-1">
          <span class="size-3 rounded-full bg-primary" />
          <span class="size-3 rounded-full bg-secondary" />
          <span class="size-3 rounded-full bg-tertiary" />
        </span>
      </span>
    </label>
    <IconButton
      :title="`Preview ${theme}`"
      class="p-1 shrink-0"
      @click="$emit('preview')">
      <EyeIcon class="w-4 h-4" />
    </IconButton>
  </div>
</template>

<script setup lang="ts">
import IconButton from "@/components/IconButton/IconButton.vue";
import EyeIcon from "@/icons/EyeIcon.vue";
import { prettyThemeName } from "@/helpers/prettyThemeName";

defineProps<{
  theme: string;
  isAvailable: boolean;
  isPreviewing: boolean;
}>();

defineEmits<{
  (e: "toggleAvailable"): void;
  (e: "preview"): void;
}>();
</script>
