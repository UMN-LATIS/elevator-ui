<template>
  <section
    class="drawer overflow-auto h-full"
    :class="{
      // 'h-full': isOpen,
      'bg-neutral-100': variant === 'primary',
      'bg-white': variant === 'secondary',
    }"
  >
    <header
      class="flex justify-between items-center sticky top-0 left-0"
      :class="{
        'bg-neutral-900 text-white border-y border-neutral-900':
          variant === 'primary',
        'bg-neutral-50 text-neutral-900 border-y border-neutral-200':
          variant === 'secondary',
        'h-full': !isOpen,
      }"
    >
      <slot name="header">
        <h1
          class="font-bold relative p-4"
          :class="{
            'md:text-2xl': variant === 'primary',
          }"
        >
          {{ label }}
        </h1>
        <button
          class="flex place-content-center p-4 leading-none"
          @click="$emit('toggle')"
        >
          <span class="material-symbols-outlined">
            {{ isOpen ? "expand_more" : "expand_less" }}
          </span>
          <span class="sr-only">
            {{ isOpen ? "Close" : "Open" }}
          </span>
        </button>
      </slot>
    </header>

    <div v-show="isOpen" class="text-neutral-500 flex flex-col gap-8 px-4 py-8">
      <slot />
    </div>
  </section>
</template>
<script setup lang="ts">
import { ref } from "vue";

withDefaults(
  defineProps<{
    label: string;
    variant?: "primary" | "secondary";
    isOpen?: boolean;
  }>(),
  {
    isOpen: true,
    variant: "primary",
  }
);

defineEmits<{
  (eventName: "toggle");
}>();
</script>
