<template>
  <div :class="['p-6 rounded-lg', bgClass]">
    <div :class="['text-sm font-medium', textClass]">{{ label }}</div>
    <div :class="['text-xs mt-1 opacity-75', textClass]">
      {{ bgClass }}
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label: string;
  bgClass: string;
  textClass: string;
}>();
</script>
