<template>
  <DropDown
    :label="label"
    class="rounded-md bg-surface-container border border-outline-variant text-sm"
    labelClass="justify-between py-1"
    chevronClass="!w-4 !h-4"
    alignment="left">
    <slot />
  </DropDown>
</template>
<script setup lang="ts">
import DropDown from "@/components/DropDown/DropDown.vue";
defineProps<{
  label: string;
}>();
</script>
<style scoped></style>
