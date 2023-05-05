<template>
  <Notification type="error" title="Error">
    <p class="mb-2">
      Sorry, something went wrong loading these search results.
    </p>

    <div>
      <span class="uppercase text-xs mr-4">Search Text</span>
      <q>{{ searchStore.searchEntry?.searchText ?? searchStore.query }}</q>
    </div>
    <div>
      <span class="uppercase text-xs mr-4">Sort Type</span>
      <q>{{ searchStore.sort ?? "Default" }}</q>
    </div>

    <p class="mt-2">
      Try reloading, and if the problem persists, please contact
      <a href="mailto:latistecharch@umn.edu">latistecharch@umn.edu</a> for help.
    </p>
  </Notification>
</template>
<script setup lang="ts">
import Notification from "@/components/Notification/Notification.vue";
import { useSearchStore } from "@/stores/searchStore";

const searchStore = useSearchStore();
</script>
<style scoped></style>
