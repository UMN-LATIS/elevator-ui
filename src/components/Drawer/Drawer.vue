<template>
  <section class="drawer bg-neutral-200 flex flex-col">
    <header
      class="flex items-center sticky top-0 left-0 justify-between z-10"
      :class="{
        'bg-neutral-900 text-white border-y border-neutral-900':
          variant === 'primary',
        'bg-neutral-50 text-neutral-900 border-y border-neutral-300':
          variant === 'secondary',
        'h-full': !isOpen,
        'md:py-4': variant === 'primary' && isOpen,
      }"
    >
      <button
        :disabled="!showToggle"
        class="flex items-center p-4 leading-tight gap-4 flex-1"
        @click="$emit('toggle')"
      >
        <span v-if="showToggle" class="material-symbols-outlined">
          {{ isOpen ? "expand_more" : "expand_less" }}
        </span>
        <slot name="header-label">
          <DrawerLabel :label="label" :variant="variant" :isOpen="isOpen" />
        </slot>
      </button>

      <div>
        <slot name="header-utils"></slot>
      </div>
    </header>

    <div
      v-show="isOpen"
      class="text-neutral-500 flex flex-col gap-8 px-4 py-8 md:p-8 flex-1 h-min overflow-auto"
    >
      <slot />
    </div>
  </section>
</template>
<script setup lang="ts">
import DrawerLabel from "./DrawerLabel.vue";
withDefaults(
  defineProps<{
    label: string;
    variant?: "primary" | "secondary";
    isOpen?: boolean;
    showToggle?: boolean;
  }>(),
  {
    isOpen: true,
    showToggle: true,
    variant: "primary",
  }
);

defineEmits<{
  (eventName: "toggle");
}>();
</script>
<style scoped>
/* width */
::-webkit-scrollbar {
  width: 0.5rem;
}

/* Track */
::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 33%);
}

/* Handle */
::-webkit-scrollbar-thumb {
  background: #ccc;
}

/* Handle on hover */
::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>
