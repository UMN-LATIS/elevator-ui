<template>
  <div class="object-toolbar">
    <div class="flex justify-between items-center w-full px-4 py-2">
      <div class="flex gap-1 items-center leading-none">
        <MoreFileInfoButton />
        <DownloadFileButton />
        <ShareButton />
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import MoreFileInfoButton from "./MoreFileInfoButton.vue";
import DownloadFileButton from "./DownloadFileButton.vue";
import ShareButton from "./ShareButton.vue";
</script>
<style scoped></style>
