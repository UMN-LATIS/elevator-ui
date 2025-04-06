<template>
  <section class="border-t-2 border-neutral-900 p-4">
    <header>
      <slot name="header">
        <h2 class="text-2xl font-bold">{{ label }}</h2>
      </slot>
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
