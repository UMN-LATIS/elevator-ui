<template>
  <button class="app-menu-button p-2 rounded-full" @click="isOpen = true">
    <MenuIcon />
  </button>
  <Teleport to="body">
    <div class="overflow-hidden fixed inset-0 pointer-events-none z-30">
      <div
        class="fixed inset-0 transition-opacity z-0"
        :class="{
          ' bg-black opacity-50 pointer-events-auto': isOpen,
          'opacity-0': !isOpen,
        }"
        @click.self="isOpen = false"
      />
      <AppMenu
        class="absolute right-0 top-0 bottom-0 z-10 transition-transform transform-gpu pointer-events-auto"
        :class="{
          'translate-x-full': !isOpen,
          'translate-x-0': isOpen,
        }"
        @close="isOpen = false"
      />
    </div>
  </Teleport>
</template>
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import MenuIcon from "@/icons/MenuIcon.vue";
import AppMenu from "../AppMenu/AppMenu.vue";

const isOpen = ref(false);

function closeIfEsc(event: KeyboardEvent) {
  if (isOpen.value && event.keyCode === 27) {
    isOpen.value = false;
  }
}

onMounted(() => {
  document.addEventListener("keydown", closeIfEsc);
});

onUnmounted(() => document.removeEventListener("keydown", closeIfEsc));
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
