<template>
  <section
    class="drawer bg-neutral-100 w-[28rem] absolute bottom-0 left-0"
    :class="{
      'h-full': isOpen,
    }"
  >
    <header
      class="flex justify-between bg-neutral-900 text-white"
      :class="{
        'items-baseline p-4': isOpen,
        'items-center ': !isOpen,
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

defineProps<{
  label: string;
}>();

const isOpen = ref(true);
</script>
