<template>
  <Button
    class="arrow-button !rounded-full !p-2 cursor-pointer"
    variant="primary"
    v-bind="$attrs">
    <slot />
    <ArrowForwardIcon />
  </Button>
</template>
<script setup lang="ts">
import ArrowForwardIcon from "@/icons/ArrowForwardIcon.vue";
import Button from "@/components/Button/Button.vue";
</script>
<style scoped></style>
