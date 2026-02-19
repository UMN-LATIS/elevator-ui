<template>
  <footer
    v-if="instanceStore.customFooterText"
    class="app-footer bg-surface-container border-t border-outline">
    <SanitizedHTML
      :html="instanceStore.customFooterText"
      :addTags="['style', 'link']" />
  </footer>
</template>
<script setup lang="ts">
import { useInstanceStore } from "@/stores/instanceStore";
import SanitizedHTML from "../SanitizedHTML/SanitizedHTML.vue";

const instanceStore = useInstanceStore();
</script>
