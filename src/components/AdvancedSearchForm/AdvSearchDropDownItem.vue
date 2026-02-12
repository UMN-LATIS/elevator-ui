<template>
  <DropDownItem
    class="!whitespace-nowrap overflow-ellipsis overflow-x-hidden"
    :class="{ 'opacity-30 hover:text-on-surface-variant': disabled }"
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
