<template>
  <Teleport to="body">
    <div
      ref="modal"
      :class="{
        'flex bg-transparent-black-700 fixed inset-0 z-50 justify-center items-center':
          isOpen,
        hidden: !isOpen,
      }"
      @click.self="$emit('close')"
    >
      <div
        class="bg-neutral-50 border absolute inset-4 md:inset-16 rounded-2xl flex flex-col overflow-hidden max-w-[60rem] m-auto"
        v-bind="$attrs"
      >
        <XButton
          class="absolute right-4 top-4 md:top-8 md:right-8"
          @click="$emit('close')"
        />
        <header
          class="flex justify-between items-start p-4 md:p-8 border-b bg-neutral-100"
        >
          <h2 class="flex-1 font-bold text-2xl mr-12">{{ label }}</h2>
        </header>
        <div class="flex-1 overflow-auto p-4 md:p-8">
          <slot />
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

const modal = ref<HTMLDivElement>();

function closeIfEsc(event) {
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
.modal {
  display: none;
}
.modal.modal--is-open {
  display: flex;
  background: rgba(0, 0, 0, 0.66);
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal__contents {
  background: #f3f3f3;
  border: 1px solid transparent;
  position: absolute;
  max-height: 90vh;
  width: 90vw;
  max-width: 60rem;
  overflow: auto;
  border-radius: 1rem;
}
::-webkit-scrollbar {
  width: 0.5rem;
}

/* Track */
::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 33%);
}

/* Handle */
::-webkit-scrollbar-thumb {
  background: #aaa;
}

/* Handle on hover */
::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>
