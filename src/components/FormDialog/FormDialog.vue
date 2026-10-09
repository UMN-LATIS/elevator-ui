<template>
  <DialogRoot :open="isOpen" @update:open="setOpenUnlessSubmitting">
    <DialogPortal>
      <DialogOverlay class="fixed inset-0 z-40 bg-scrim" />
      <DialogContent
        v-bind="description ? {} : { 'aria-describedby': undefined }"
        class="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-lg bg-surface p-6 text-on-surface shadow-lg focus:outline-none"
        @openAutoFocus.prevent>
        <form ref="form" @submit.prevent="emit('submit')">
          <DialogTitle class="m-0 text-xl font-bold">{{ title }}</DialogTitle>
          <DialogDescription
            v-if="description"
            class="mt-1 text-sm text-on-surface-variant">
            {{ description }}
          </DialogDescription>
          <div class="mt-6 flex flex-col gap-4">
            <slot />
          </div>
          <div class="mt-6 flex justify-end gap-2">
            <DialogClose asChild>
              <Button type="button" variant="tertiary" :disabled="isSubmitting">
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              variant="primary"
              :disabled="isSubmitDisabled || isSubmitting">
              <SpinnerIcon v-if="isSubmitting" aria-hidden="true" />
              {{ isSubmitting ? "Saving…" : submitLabel }}
            </Button>
          </div>
        </form>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

<script setup lang="ts">
import { nextTick, useTemplateRef, watch } from "vue";
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
} from "reka-ui";
import Button from "@/components/Button/Button.vue";
import { SpinnerIcon } from "@/icons";

const props = withDefaults(
  defineProps<{
    title: string;
    description?: string;
    submitLabel?: string;
    isSubmitting?: boolean;
    isSubmitDisabled?: boolean;
  }>(),
  {
    description: undefined,
    submitLabel: "Save",
  }
);

const isOpen = defineModel<boolean>("open", { required: true });

const emit = defineEmits<{
  submit: [];
}>();

const form = useTemplateRef<HTMLFormElement>("form");

// Closing mid-save lets that save's completion close
// the reopened dialog and discard its new draft.
function setOpenUnlessSubmitting(open: boolean): void {
  if (props.isSubmitting) return;
  isOpen.value = open;
}

watch(isOpen, async (open) => {
  if (!open) return;
  await nextTick();
  form.value
    ?.querySelector<HTMLElement>(
      "input:not(:disabled), select:not(:disabled), [role=combobox]:not(:disabled)"
    )
    ?.focus();
});
</script>
