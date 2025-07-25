<template>
  <div
    class="avatar inline-flex justify-center items-center rounded-full w-6 h-6 border text-xs border-neutral-900 font-sans">
    {{ firstInitial }}
  </div>
</template>
<script setup lang="ts">
import { computed } from "vue";
const props = defineProps<{
  name: string;
}>();

const firstInitial = computed(() => {
  if (!props.name.length) {
    return "X";
  }

  return props.name[0].toUpperCase();
});
</script>
<style scoped></style>
