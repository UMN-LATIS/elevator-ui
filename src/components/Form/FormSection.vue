<template>
  <section
    :id="id"
    class="border-t border-outline-variant py-6 grid sm:grid-cols-[15rem,1fr] gap-4 items-start">
    <h2 class="text-lg font-semibold">{{ title }}</h2>
    <div class="space-y-4">
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  id: string;
  title: string;
}>();
</script>
