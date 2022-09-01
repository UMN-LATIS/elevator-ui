<template>
  <section
    class="drawer overflow-auto"
    :class="{
      'h-full': isOpen,
      'bg-neutral-100': variant === 'primary',
      'bg-white': variant === 'secondary',
    }"
  >
    <header
      class="flex justify-between"
      :class="{
        'items-baseline p-4': isOpen,
        'items-center ': !isOpen,
        'bg-neutral-900 text-white border-y border-neutral-900':
          variant === 'primary',
        'bg-neutral-50 text-neutral-900 border-y border-neutral-200':
          variant === 'secondary',
      }"
    >
      <h1
        class="font-bold relative"
        :class="{
          'text-3xl p-4': isOpen,
          'p-4': !isOpen,
        }"
      >
        {{ label }}
      </h1>
      <button
        class="flex place-content-center p-4 leading-none"
        @click="isOpen = !isOpen"
      >
        <span class="material-icons">
          {{ isOpen ? "expand_more" : "expand_less" }}
        </span>
        <span class="sr-only">
          {{ isOpen ? "Close" : "Open" }}
        </span>
      </button>
    </header>
    <div v-show="isOpen" class="text-neutral-500 flex flex-col gap-8 p-8">
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
  }>(),
  {
    variant: "primary",
  }
);

const isOpen = ref(true);
</script>
