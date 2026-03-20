<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="isOpen"
        ref="modal"
        class="modal flex bg-scrim fixed inset-0 z-50 justify-center items-center p-4 min-h-dvh"
        @click.self="$emit('close')">
        <div
          class="modal-contents shadow-lg relative rounded-2xl flex flex-col overflow-hidden max-w-[60rem] max-h-[90vh] m-auto w-full"
          v-bind="$attrs">
          <XButton
            class="absolute right-4 top-4 md:top-8 md:right-8 z-10"
            @click="$emit('close')" />
          <header
            class="modal-contents__header flex justify-between items-start p-4 md:p-8">
            <h2 class="flex-1 font-bold text-2xl mr-12 flex items-center">
              <slot name="label">
                {{ label }}
              </slot>
            </h2>
          </header>
          <div class="modal-contents__body flex-1 overflow-auto p-4 md:p-8">
            <slot />
          </div>
          <div v-if="$slots.footer" class="modal-contents__footer">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
<script setup lang="ts">
import { watch, provide, computed } from "vue";
import { IsModalOpenKey } from "@/constants/constants";
import XButton from "../XButton/XButton.vue";

const props = withDefaults(
  defineProps<{
    label?: string | null;
    isOpen: boolean;
  }>(),
  {
    label: "",
    isOpen: false,
  }
);

const emit = defineEmits<{
  (eventName: "close"): void;
}>();

function closeIfEsc(event: KeyboardEvent) {
  if (event.key === "Escape") {
    emit("close");
  }
}

// Add/remove listeners and body scroll lock reactively
watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      document.addEventListener("keydown", closeIfEsc);
      document.body.style.overflow = "hidden";
    } else {
      document.removeEventListener("keydown", closeIfEsc);
      document.body.style.overflow = "";
    }
  },
  { immediate: true }
);

provide(
  IsModalOpenKey,
  computed(() => props.isOpen)
);
</script>
<style scoped>
.modal-contents {
  background: var(--surface-container-low);
  color: var(--on-surface);
}

.modal-contents__header {
  background: var(--surface-container);
  color: var(--on-surface);
}

.modal-enter-active {
  transition: opacity 0.3s ease;
}
.modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-contents {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.modal-leave-active .modal-contents {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.modal-enter-from .modal-contents,
.modal-leave-to .modal-contents {
  opacity: 0;
  transform: scale(0.95);
}
</style>
