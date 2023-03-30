<template>
  <article
    class="static-page-content m-auto sm:max-w-3xl p-4 sm:p-12 rounded shadow sm:px-12 sm:my-8"
  >
    <h2 class="text-3xl mb-12 sm:text-5xl font-bold mt-4">
      {{ page?.title }}
    </h2>

    <SanitizedHTML :html="page.content" class="prose prose-neutral" />
  </article>
</template>
<script setup lang="ts">
import { StaticContentPage } from "@/types";
import SanitizedHTML from "@/components/SanitizedHTML/SanitizedHTML.vue";

defineProps<{
  page: StaticContentPage;
}>();
</script>
<style scoped>
.static-page-content {
  background: var(--app-metaDataOnlyView-contentViewer-backgroundColor);
  color: var(--app-metaDataOnlyView-contentViewer-textColor);
}
</style>
