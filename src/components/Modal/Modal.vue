<template>
  <Teleport to="body">
    <div
      ref="modal"
      :class="{
        'modal flex bg-scrim fixed inset-0 z-50 justify-center items-center p-4 min-h-dvh backdrop-blur-[2px]':
          isOpen,
        hidden: !isOpen,
      }"
      @click.self="$emit('close')">
      <div
        class="modal-contents shadow-lg relative rounded-2xl flex flex-col overflow-hidden max-w-[60rem] max-h-[90vh] m-auto w-full p-4 md:p-8 gap-4 md:gap-6 bg-surface text-on-surface"
        v-bind="$attrs">
        <XButton
          class="absolute top-4 right-4 md:top-8 md:right-8"
          @click="$emit('close')" />
        <header class="modal-contents__header flex justify-between items-start">
          <h2
            class="flex-1 font-bold text-lg md:text-2xl mr-12 flex items-center">
            <slot name="label">
              {{ label }}
            </slot>
          </h2>
        </header>
        <div class="modal-contents__body flex-1 overflow-auto">
          <slot />
        </div>
        <div v-if="$slots.footer" class="modal-contents__footer">
          <slot name="footer" />
        </div>
      </div>
    </div>
  </Teleport>
</template>
<script setup lang="ts">
import { onMounted, onUnmounted, ref, provide, computed } from "vue";
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

const modal = ref<HTMLDivElement | undefined>();

function closeIfEsc(event: KeyboardEvent) {
  if (props.isOpen && event.keyCode === 27) {
    emit("close");
  }
}

onMounted(() => {
  document.addEventListener("keydown", closeIfEsc);
});

onUnmounted(() => document.removeEventListener("keydown", closeIfEsc));

provide(
  IsModalOpenKey,
  computed(() => props.isOpen)
);
</script>
<style scoped></style>
