<template>
  <header class="flex justify-between items-end gap-4 flex-wrap mb-6">
    <div class="min-w-0 flex-1">
      <h1 class="text-3xl font-bold tracking-tight leading-[1.15] m-0">
        {{ title }}
      </h1>
      <p
        v-if="description"
        class="text-sm text-on-surface-variant leading-relaxed max-w-2xl mt-2">
        {{ description }}
      </p>
    </div>
    <div v-if="$slots.actions" class="flex gap-2 items-center flex-shrink-0">
      <slot name="actions" />
    </div>
  </header>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  description?: string;
}>();
</script>
