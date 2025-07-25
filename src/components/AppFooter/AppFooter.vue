<template>
  <footer
    v-if="instanceStore.customFooter"
    class="app-footer bg-transparent-black-100">
    <SanitizedHTML :html="instanceStore.customFooter" :addTags="['style', 'link', 'script']" />
  </footer>
</template>
<script setup lang="ts">
import { useInstanceStore } from "@/stores/instanceStore";
import SanitizedHTML from "../SanitizedHTML/SanitizedHTML.vue";

const instanceStore = useInstanceStore();
</script>
<style scoped>
.app-footer {
  border-top: var(--app-borderWidth) solid var(--app-borderColor);
}
</style>
