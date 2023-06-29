<template>
  <TransitionRoot :show="isOpen" as="template" class="fixed inset-0 z-40">
    <Dialog as="div" @close="handleClose">
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
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <TransitionChild
          enter="duration-300 ease-out"
          enterFrom="opacity-0 scale-95"
          enterTo="opacity-100 scale-100"
          leave="duration-200 ease-in"
          leaveFrom="opacity-100 scale-100"
          leaveTo="opacity-0 scale-95"
        >
          <DialogPanel>
            <Notification
              :title="title"
              :type="type"
              isDismissable
              @dismiss="handleClose"
            >
              <slot />

              <div class="flex justify-end mt-4 space-x-2">
                <Button variant="tertiary" @click="handleClose">
                  {{ cancelLabel }}
                </Button>
                <Button
                  ref="confirmButtonRef"
                  :variant="confirmButtonVariant"
                  @click="handleConfirm"
                >
                  {{ confirmLabel }}
                </Button>
              </div>
            </Notification>
          </DialogPanel>
        </TransitionChild>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, computed, ref } from "vue";
import {
  Dialog,
  DialogPanel,
  TransitionRoot,
  TransitionChild,
} from "@headlessui/vue";
import Notification from "@/components/Notification/Notification.vue";
import Button from "@/components/Button/Button.vue";

const props = withDefaults(
  defineProps<{
    isOpen: boolean;
    title: string;
    type?: "info" | "success" | "warning" | "danger";
    confirmLabel?: string;
    cancelLabel?: string;
  }>(),
  {
    type: "info",
    confirmLabel: "Confirm",
    cancelLabel: "Cancel",
  }
);

const emit = defineEmits<{
  (eventName: "close");
  (eventName: "confirm");
}>();

const confirmButtonRef = ref<HTMLButtonElement | null>(null);

const confirmButtonVariant = computed(() => {
  if (props.type === "danger") {
    return "danger";
  }
  return "primary";
});

function handleConfirm() {
  emit("confirm");
  emit("close");
}

function handleClose() {
  console.log("close");
  emit("close");
}
</script>
