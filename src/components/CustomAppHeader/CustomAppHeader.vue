<template>
  <div class="custom-app-header bg-surface-container">
    <SanitizedHTML :html="customHeaderText" :addTags="['style', 'link']" />
  </div>
</template>
<script setup lang="ts">
import { useCustomHeaderFooter } from "@/composables/useCustomHeaderFooter";
import SanitizedHTML from "../SanitizedHTML/SanitizedHTML.vue";

const { customHeaderText } = useCustomHeaderFooter();
</script>
<style scoped></style>
