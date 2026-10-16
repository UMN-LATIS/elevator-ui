<template>
  <div class="custom-app-header bg-surface-container">
    <InstanceHTML :html="customHeaderText" :addTags="['style', 'link']" />
  </div>
</template>
<script setup lang="ts">
import { useCustomHeaderFooter } from "@/composables/useCustomHeaderFooter";
import InstanceHTML from "@/components/InstanceHTML/InstanceHTML.vue";

const { customHeaderText } = useCustomHeaderFooter();
</script>
<style scoped></style>
