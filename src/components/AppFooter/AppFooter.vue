<template>
  <footer
    v-if="instanceStore.customFooter"
    class="app-footer bg-transparent-black-100"
  >
    <SanitizedHTML
      class="flex flex-col max-w-screen-xl mx-auto p-4 lg:p-8"
      :html="instanceStore.customFooter"
    />
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
  font-size: 0.825rem;
  & :is(h1, h2, h3, h4, h5) {
    font-size: 1rem;
    font-weight: bold;
  }
}
</style>
