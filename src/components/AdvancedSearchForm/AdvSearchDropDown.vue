<template>
  <DropDown
    :label="label"
    class="rounded-md text-sm bg-transparent-black-100"
    labelClass="justify-between p-2 py-1"
    chevronClass="!w-4 !h-4"
    alignment="left"
  >
    <div class="max-h-[50vh] overflow-y-auto">
      <slot />
    </div>
  </DropDown>
</template>
<script setup lang="ts">
import DropDown from "@/components/DropDown/DropDown.vue";
defineProps<{
  label: string;
}>();
</script>
<style scoped></style>
