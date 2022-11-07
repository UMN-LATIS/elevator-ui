<template>
  <Button class="arrow-button rounded-full p-2" variant="primary">
    <slot />
    <ArrowForwardIcon />
  </Button>
</template>
<script setup lang="ts">
import ArrowForwardIcon from "@/icons/ArrowForwardIcon.vue";
import Button from "@/components/Button/Button.vue";
</script>
<style scoped></style>
