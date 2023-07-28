<template>
  <Teleport to="body">
    <div
      ref="modal"
      :class="{
        'modal flex bg-transparent-black-700 fixed inset-0 z-50 justify-center items-center p-4':
          isOpen,
        hidden: !isOpen,
      }"
      @click.self="$emit('close')"
    >
      <div
        class="modal-contents shadow-lg relative rounded-2xl flex flex-col overflow-hidden max-w-[60rem] max-h-[90vh] m-auto w-full"
        v-bind="$attrs"
      >
        <XButton
          class="absolute right-4 top-4 md:top-8 md:right-8"
          @click="$emit('close')"
        />
        <header
          class="modal-contents__header flex justify-between items-start p-4 md:p-8"
        >
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
  </Teleport>
</template>
<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
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
</script>
<style scoped>
.modal-contents {
  background: var(--app-modalContents-backgroundColor);
  color: var(--app-modalContents-textColor);
}
.modal-contents__header {
  background: var(--app-modalContents-header-backgroundColor);
  color: var(--app-modalContents-header-textColor);
}
</style>
