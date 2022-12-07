<template>
  <Popper class="popover" :hover="hover" :arrow="arrow">
    <slot />
    <template v-if="!content" #content>
      <div class="popover-content text-xs py-1 px-2">
        <slot name="content" />
      </div>
    </template>
    <template v-else #content>
      <span class="text-xs py-1 px-2 whitespace-nowrap" v-bind="$attrs">{{
        content
      }}</span>
    </template>
  </Popper>
</template>
<script setup lang="ts">
import Popper from "vue3-popper";

withDefaults(
  defineProps<{
    hover?: boolean;
    arrow?: boolean;
    content?: string;
  }>(),
  {
    content: undefined,
    hover: true,
    arrow: true,
  }
);
</script>
<style>
:root {
  --popper-theme-background-color: var(--app-background-color, #fff);
  --popper-theme-background-color-hover: var(
    --app-background-color-hover,
    #fff
  );
  --popper-theme-text-color: var(--app-text-color, #111);
  --popper-theme-border-width: 0px;
  --popper-theme-border-style: solid;
  /* --popper-theme-border-radius: 0.25rem; */
  /* --popper-theme-padding: 0.5rem; */
  --popper-theme-box-shadow: 0 6px 30px -6px rgba(0, 0, 0, 0.25);
}
</style>
