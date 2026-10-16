<template>
  <footer
    v-if="customFooterText"
    class="app-footer bg-surface-container border-t border-outline">
    <InstanceHTML :html="customFooterText" :addTags="['style', 'link']" />
  </footer>
</template>
<script setup lang="ts">
import { useCustomHeaderFooter } from "@/composables/useCustomHeaderFooter";
import InstanceHTML from "@/components/InstanceHTML/InstanceHTML.vue";

const { customFooterText } = useCustomHeaderFooter();
</script>
