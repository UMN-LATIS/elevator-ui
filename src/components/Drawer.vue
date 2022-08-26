<template>
  <div
    class="drawer min-h-full flex sm:max-w-[50%] md:max-w-[33%] lg:max-w-[25%]"
    :class="{
      'bg-neutral-50': color === 'light',
      'bg-neutral-300': color === 'gray',
      'drawer--color-dark bg-neutral-800': color === 'dark',
    }"
  >
    <header
      class="sideways hidden sm:flex gap-8 items-center justify-start p-2 2xl:px-4 whitespace-nowrap cursor-pointer bg-transparent-black-100"
      :class="{
        invert: color === 'dark',
      }"
      aria-role="button"
      @click="$emit('toggle')"
    >
      <div class="flex gap-4 items-center justify-start">
        <div class="rounded-full p-1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6"
            :class="{
              'rotate-180': isOpen,
            }"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </div>
        <h1 class="font-bold uppercase tracking-wider">
          {{ label }}
        </h1>
      </div>
      <ul
        v-if="details"
        class="text-sm flex content-center gap-4 text-neutral-500 overflow-hidden"
        :class="{
          hidden: isOpen,
        }"
      >
        <li v-for="(item, i) in details" :key="i">
          {{ item }}
        </li>
      </ul>
    </header>

    <article
      class="p-4 overflow-y-auto w-full"
      :class="{
        invert: color === 'dark',
        'sm:hidden': !isOpen,
      }"
    >
      <SectionHeading>{{ label }}</SectionHeading>
      <div class="text-neutral-500 flex flex-col gap-8">
        <slot />
      </div>
    </article>
  </div>
</template>
<script setup lang="ts">
import SectionHeading from "./SectionHeading.vue";

withDefaults(
  defineProps<{
    isOpen: boolean;
    color: "light" | "dark" | "gray";
    label: string;
    details?: string[];
    size?: "xs" | "sm" | "md" | "lg";
  }>(),
  {
    isOpen: false,
    color: "gray",
    details: () => [],
    size: "sm",
  }
);

defineEmits<{
  (eventName: "toggle"): void;
}>();
</script>
<style>
.drawer--color-dark img {
  filter: invert(1);
}
</style>
