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
  transition: all 0.1s;
  color: var(--app-appMenuButton-textColor);
  background: var(--app-appMenuButton-backgroundColor);
  border-color: var(--app-appMenuButton-borderColor);
  &:hover {
    color: var(--app-appMenuButton-hover-textColor);
    background: var(--app-appMenuButton-hover-backgroundColor);
    border-color: var(--app-appMenuButton-hover-borderColor);
  }
  &:active {
    color: var(--app-appMenuButton-active-textColor);
    background: var(--app-appMenuButton-active-backgroundColor);
    border-color: var(--app-appMenuButton-active-borderColor);
  }
  &:disabled {
    color: var(--app-appMenuButton-disabled-textColor);
    background: var(--app-appMenuButton-disabled-backgroundColor);
    border-color: var(--app-appMenuButton-disabled-borderColor);
  }
}
</style>
