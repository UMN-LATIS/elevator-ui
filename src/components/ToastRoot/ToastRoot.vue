<template>
  <div
    class="toast-root fixed bottom-4 right-0 z-50 p-4 w-full max-w-sm pointer-events-none flex flex-col items-end gap-1">
    <button
      v-if="toastStore.toasts.length > 1"
      class="pointer-events-auto text-xs uppercase py-1 px-2 rounded-md shadow-md bg-inverse-surface text-inverse-on-surface opacity-80 hover:opacity-100"
      @click="toastStore.clearAll()">
      Clear All
    </button>
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
