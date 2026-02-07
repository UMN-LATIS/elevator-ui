<template>
  <div class="custom-app-header bg-surface-container">
    <SanitizedHTML
      :html="instanceStore?.customHeader ?? ''"
      :addTags="['style', 'link']" />
  </div>
</template>
<script setup lang="ts">
import { useInstanceStore } from "@/stores/instanceStore";
import SanitizedHTML from "../SanitizedHTML/SanitizedHTML.vue";

const instanceStore = useInstanceStore();
</script>
<style scoped></style>
