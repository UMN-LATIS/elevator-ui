<template>
  <DropDownItem
    class="!whitespace-nowrap overflow-ellipsis overflow-x-hidden"
    :class="{ 'opacity-30 hover:text-neutral-700': disabled }"
    :disabled="disabled">
    <slot />
  </DropDownItem>
</template>
<script setup lang="ts">
import DropDownItem from "../DropDown/DropDownItem.vue";

defineProps<{
  disabled?: boolean;
}>();
</script>
<style scoped></style>
