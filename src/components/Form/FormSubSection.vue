<template>
  <section
    :class="[
      'flex flex-col gap-4',
      isOpen && 'border-y border-outline-variant py-2',
    ]">
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
