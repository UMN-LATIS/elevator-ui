<template>
  <h1
    class="header-label font-bold relative text-left"
    :class="{
      'sm:text-3xl md:text-4xl': variant === 'primary' && isOpen,
      'sm:text-2xl md:text-3xl':
        label.length >= 100 && label.length < 200 && isOpen,
      'sm:text-xl md:text-xl': label.length >= 200 && isOpen,
    }"
    :title="label"
  >
    <span class="min-w-0 block">{{ label }}</span>
  </h1>
</template>
<script setup lang="ts">
defineProps<{
  label: string;
  variant: "primary" | "secondary";
  isOpen: boolean;
}>();
</script>
<style scoped></style>
