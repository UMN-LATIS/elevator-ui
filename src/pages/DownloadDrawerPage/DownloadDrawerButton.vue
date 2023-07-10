<template>
  <Button
    title="Download Drawer"
    variant="tertiary"
    :to="`/drawers/downloadDrawer/${drawerId}`"
  >
    <DownloadIcon class="!w-5 !h-5" />
    Download Drawer
  </Button>
</template>
<script setup lang="ts">
import Button from "@/components/Button/Button.vue";
import { DownloadIcon } from "@/icons";

defineProps<{
  drawerId: number;
}>();
</script>
<style scoped></style>
