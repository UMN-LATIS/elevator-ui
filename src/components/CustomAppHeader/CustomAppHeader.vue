<template>
  <div class="custom-app-header bg-transparent-black-100">
    <SanitizedHTML
      :html="instanceStore?.customHeader ?? ''"
      :addTags="['style', 'link', 'script']"
      :permitScripts="true"
      class="w-full" />
  </div>
</template>
<script setup lang="ts">
import { useInstanceStore } from "@/stores/instanceStore";
// import { useScripts } from "@/composables/useScripts";
import SanitizedHTML from "../SanitizedHTML/SanitizedHTML.vue";

const instanceStore = useInstanceStore();
</script>
<style scoped></style>
