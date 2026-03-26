<template>
  <DefaultLayout>
    <div class="container py-10 mx-auto max-w-3xl space-y-12">
      <h1 class="text-3xl font-bold">Notification & Dialog Preview</h1>

      <section class="space-y-4">
        <h2 class="text-xl font-semibold">Standalone Notifications</h2>
        <Notification
          v-for="type in TYPES"
          :key="type"
          :type="type"
          :title="`${type} notification`"
          isDismissable>
          This is a {{ type }} notification with a dismissable close button.
        </Notification>
      </section>

      <section class="space-y-4">
        <h2 class="text-xl font-semibold">Confirm Dialogs</h2>
        <div class="flex gap-3 flex-wrap">
          <Button
            v-for="type in TYPES"
            :key="type"
            variant="secondary"
            @click="openDialog = type">
            Open {{ type }} dialog
          </Button>
        </div>
        <ConfirmModal
          v-for="type in TYPES"
          :key="type"
          :isOpen="openDialog === type"
          :type="type"
          :title="`${type} confirmation`"
          :confirmLabel="`Confirm ${type}`"
          @confirm="openDialog = null"
          @close="openDialog = null">
          This is a {{ type }} confirm dialog. The buttons should harmonize
          with the dialog's color family.
        </ConfirmModal>
      </section>

      <section class="space-y-4">
        <h2 class="text-xl font-semibold">Toasts</h2>
        <div class="flex gap-3 flex-wrap">
          <Button
            v-for="variant in TOAST_VARIANTS"
            :key="variant"
            variant="secondary"
            @click="showToast(variant)">
            {{ variant }} toast
          </Button>
        </div>
      </section>
    </div>
  </DefaultLayout>
</template>

<script setup lang="ts">
import { ref } from "vue";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import Notification from "@/components/Notification/Notification.vue";
import ConfirmModal from "@/components/ConfirmModal/ConfirmModal.vue";
import Button from "@/components/Button/Button.vue";
import { useToastStore } from "@/stores/toastStore";

const TYPES = ["info", "success", "warning", "danger"] as const;
const TOAST_VARIANTS = ["default", "success", "error"] as const;

const openDialog = ref<string | null>(null);
const toastStore = useToastStore();

const showToast = (variant: (typeof TOAST_VARIANTS)[number]) => {
  toastStore.addToast({
    message: `This is a ${variant} toast message.`,
    title: `${variant} toast`,
    variant,
    duration: 6000,
    action: {
      label: "Undo",
      handler: () => {},
    },
  });
};
</script>
