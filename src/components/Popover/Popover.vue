<template>
  <Popper class="popover" :hover="hover" :arrow="arrow">
    <slot />
    <template #content>
      <slot name="content">
        <div class="popover-content" v-bind="$attrs">
          {{ content }}
        </div>
      </slot>
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
  --popper-theme-background-color: var(--inverse-surface);
  --popper-theme-background-color-hover: var(--inverse-surface);
  --popper-theme-text-color: var(--inverse-on-surface);
  --popper-theme-border-width: 0px;
  --popper-theme-border-style: solid;
  --popper-theme-border-radius: 0.25rem;
  --popper-theme-padding: 0.5em;
  --popper-theme-box-shadow: 0 6px 30px -6px rgba(0, 0, 0, 0.25);
}

.popover-content {
  font-size: 14px;
}
</style>
