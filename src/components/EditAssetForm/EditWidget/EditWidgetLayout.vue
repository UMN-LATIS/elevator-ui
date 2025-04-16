<template>
  <section class="py-4">
    <header class="flex justify-between items-center gap-4">
      <h2 class="text-lg font-bold">{{ label }}</h2>
      <div>
        <slot name="header-right" />
      </div>
    </header>
    <div>
      <slot>
        <p>Default content for the Edit Widget</p>
      </slot>
    </div>
  </section>
</template>
<script setup lang="ts">
defineProps<{
  label: string;
}>();
</script>
<style scoped></style>
