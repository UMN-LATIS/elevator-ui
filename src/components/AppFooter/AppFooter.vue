<template>
  <footer
    v-if="instanceStore.customFooter"
    class="app-footer bg-surface-container border-t border-outline">
    <SanitizedHTML
      :html="instanceStore.customFooter"
      :addTags="['style', 'link']" />
  </footer>
</template>
<script setup lang="ts">
import { useInstanceStore } from "@/stores/instanceStore";
import SanitizedHTML from "../SanitizedHTML/SanitizedHTML.vue";

const instanceStore = useInstanceStore();
</script>
