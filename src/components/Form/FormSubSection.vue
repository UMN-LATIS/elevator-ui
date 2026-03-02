<template>
  <section :class="['flex flex-col gap-4', isOpen && 'border border-outline p-2 rounded-md']">
    <slot />
    <template v-if="isOpen">
      <slot name="details" />
    </template>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  isOpen: boolean;
}>();
</script>
