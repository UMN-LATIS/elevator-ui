<template>
  <Button>
    <slot />
    <MoreLikeThisCountChip>
      {{ count }}
    </MoreLikeThisCountChip>
  </Button>
</template>
<script setup lang="ts">
import MoreLikeThisCountChip from "./CountChip.vue";
import Button from "../Button/Button.vue";

defineProps<{
  count: number;
}>();
</script>
<style scoped></style>
