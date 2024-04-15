<template>
  <div
    class="toast-root fixed top-12 right-0 z-50 p-4 w-full max-w-sm pointer-events-none flex flex-col items-end gap-1">
    <TransitionGroup name="fade">
      <Toast
        v-for="toast in toastStore.toasts"
        :key="toast.id"
        :toast="toast"
        class="w-full pointer-events-auto shadow-md"
        @dismiss="toastStore.dismissToast(toast.id)" />
    </TransitionGroup>
  </div>
</template>
<script setup lang="ts">
import { useToastStore } from "@/stores/toastStore";
import Toast from "./Toast.vue";

const toastStore = useToastStore();
</script>
<style scoped></style>
