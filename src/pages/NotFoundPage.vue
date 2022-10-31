<template>
  <DefaultLayout>
    <div class="p-8">
      <h1 class="text-8xl font-bold text-neutral-200">404</h1>
      <h2 class="text-4xl mb-8">Page not found</h2>
      <p class="my-4">Sorry. We couldn't find this page.</p>
      <Button :href="config.base.url" icon="home" iconPosition="start">
        Go Home
      </Button>
    </div>
  </DefaultLayout>
</template>
<script setup lang="ts">
import Button from "@/components/Button/Button.vue";
import config from "@/config";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import { useRoute } from "vue-router";

const route = useRoute();

console.log({ route });
</script>
<style scoped></style>
