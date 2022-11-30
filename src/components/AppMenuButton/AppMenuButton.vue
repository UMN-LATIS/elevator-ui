<template>
  <button class="app-menu-button p-2 rounded-full" @click="isOpen = true">
    <MenuIcon />
  </button>
  <Teleport to="body">
    <div
      ref="appMenuContainer"
      :class="{
        'flex bg-transparent-black-700 fixed inset-0 z-30 justify-center items-center':
          isOpen,
        hidden: !isOpen,
      }"
      @click.self="isOpen = false"
    >
      <AppMenu
        class="absolute right-0 top-0 bottom-0"
        @close="isOpen = false"
      />
    </div>
  </Teleport>
</template>
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import MenuIcon from "@/icons/MenuIcon.vue";
import AppMenu from "../AppMenu/AppMenu.vue";

const appMenuContainer = ref<HTMLDivElement | null>(null);
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
