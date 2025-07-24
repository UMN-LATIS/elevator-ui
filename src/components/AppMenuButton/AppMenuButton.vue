<template>
  <button
    ref="buttonRef"
    class="app-menu-button p-2 rounded-full"
    tabindex="0"
    :aria-expanded="isOpen"
    aria-controls="app-menu-navigation"
    aria-label="Toggle main menu"
    @click="isOpen = !isOpen">
    <MenuIcon />
  </button>
  <Teleport to="body">
    <div class="overflow-hidden fixed inset-0 pointer-events-none z-30">
      <Transition name="fade">
        <div
          v-show="isOpen"
          class="fixed inset-0 transition-opacity z-20 bg-black opacity-50 pointer-events-auto"
          @click.self="handleClose" />
      </Transition>
      <Transition name="slide-right">
        <AppMenu
          v-show="isOpen"
          class="absolute right-0 top-0 bottom-0 z-30 transition-transform transform-gpu pointer-events-auto"
          @close="handleClose" />
      </Transition>
    </div>
  </Teleport>
</template>
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import MenuIcon from "@/icons/MenuIcon.vue";
import AppMenu from "../AppMenu/AppMenu.vue";

const isOpen = ref(false);
const buttonRef = ref<HTMLButtonElement | null>(null);

function handleClose() {
  isOpen.value = false;
  buttonRef.value?.focus();
}

function closeIfEsc(event: KeyboardEvent) {
  if (isOpen.value && event.key === "Escape") {
    handleClose();
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
