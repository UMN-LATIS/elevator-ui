<template>
  <button class="app-menu-button p-2 rounded-full">
    <MenuIcon />
  </button>
  <MenuPanel>
    <template #header>
      {{ instanceStore.instance.name }}
    </template>
  </MenuPanel>
</template>
<script setup lang="ts">
import MenuIcon from "@/icons/MenuIcon.vue";
import { useInstanceStore } from "@/stores/instanceStore";

const instanceStore = useInstanceStore();
</script>
<style scoped lang="postcss">
.app-menu-button {
  color: var(--app-button-primary-textColor);
  background: var(--app-button-primary-backgroundColor);
  border-color: var(--app-button-primary-borderColor);
  &:hover {
    color: var(--app-button-primary-hover-textColor);
    background: var(--app-button-primary-hover-backgroundColor);
    border-color: var(--app-button-primary-hover-borderColor);
  }
  &:active {
    color: var(--app-button-primary-active-textColor);
    background: var(--app-button-primary-active-backgroundColor);
    border-color: var(--app-button-primary-active-borderColor);
  }
  &:disabled {
    color: var(--app-button-primary-disabled-textColor);
    background: var(--app-button-primary-disabled-backgroundColor);
    border-color: var(--app-button-primary-disabled-borderColor);
  }
}
</style>
