<template>
  <TransitionRoot :show="isOpen" as="template" class="fixed inset-0 z-40">
    <Dialog :initialFocus="initialFocusRef">
      <TransitionChild
        enter="duration-300 ease-out"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="duration-200 ease-in"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div class="fixed inset-0 z-40 bg-black/30" aria-hidden="true" />
      </TransitionChild>
      <TransitionChild
        enterActive="duration-300 ease-out"
        enterFrom="opacity-0 scale-95"
        enterTo="opacity-100 scale-100"
        leaveActive="duration-200 ease-in"
        leaveFrom="opacity-100 scale-100"
        leaveTo="opacity-0 scale-95"
      >
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <DialogPanel>
            <slot :initialFocusRef="initialFocusRef" />
          </DialogPanel>
        </div>
      </TransitionChild>
    </Dialog>
  </TransitionRoot>
</template>
<script setup lang="ts">
import { ref } from "vue";
import {
  Dialog,
  DialogPanel,
  TransitionRoot,
  TransitionChild,
} from "@headlessui/vue";

defineProps<{
  isOpen: boolean;
}>();

defineEmits<{
  (eventName: "close"): void;
}>();

const initialFocusRef = ref<HTMLElement | null>(null);
</script>
<style scoped></style>
