<template>
  <div
    class="md:grid lg:grid-cols-[minmax(0,1fr),minmax(auto,20rem)] relative min-h-screen">
    <div class="p-4 md:p-8 max-w-4xl mx-auto w-full mb-20 lg:mb-0">
      <Button
        variant="tertiary"
        class="mb-4 -ml-2 opacity-75 hover:opacity-100"
        @click="$router.back()">
        <ChevronLeftIcon class="w-5 h-5" />
        Back
      </Button>
      <header v-if="$slots.header || title" class="mb-8">
        <slot name="header">
          <h1 class="text-2xl md:text-4xl font-bold">{{ title }}</h1>
        </slot>
      </header>
      <slot />
    </div>
    <aside
      class="sidebar-container bg-surface-container text-on-surface lg:border-l border-t lg:border-t-0 border-outline-variant p-6 fixed bottom-0 left-0 w-full lg:static">
      <div class="sticky top-20 flex flex-col gap-6">
        <slot name="sidebar-actions" />
        <slot name="sidebar-nav" />
      </div>
    </aside>
  </div>
</template>

<script setup lang="ts">
import Button from "@/components/Button/Button.vue";
import { ChevronLeftIcon } from "@/icons";

defineProps<{
  title?: string;
}>();
</script>
