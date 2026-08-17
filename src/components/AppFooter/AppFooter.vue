<template>
  <footer
    v-if="customFooterText"
    class="app-footer bg-surface-container border-t border-outline">
    <SanitizedHTML :html="customFooterText" :addTags="['style', 'link']" />
  </footer>
</template>
<script setup lang="ts">
import { useCustomHeaderFooter } from "@/composables/useCustomHeaderFooter";
import SanitizedHTML from "../SanitizedHTML/SanitizedHTML.vue";

const { customFooterText } = useCustomHeaderFooter();
</script>
