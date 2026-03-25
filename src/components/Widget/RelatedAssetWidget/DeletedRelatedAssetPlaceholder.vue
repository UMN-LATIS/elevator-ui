<template>
  <div
    class="flex items-center gap-2 rounded px-2 py-1.5 text-sm italic text-on-surface-variant/50">
    <TrashIcon class="size-4 shrink-0" />
    <span class="truncate">{{ title }}</span>
  </div>
</template>
<script setup lang="ts">
import { TrashIcon } from "lucide-vue-next";

defineProps<{
  title: string;
}>();
</script>
