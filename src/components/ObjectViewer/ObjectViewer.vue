<template>
  <section class="object-viewer">
    <h2 class="sr-only">Object Viewer</h2>
    <iframe
      v-if="fileHandlerId"
      class="object-viewer__iframe w-full h-full min-h-[20rem]"
      :src="`${config.baseUrl}/asset/getEmbed/${fileHandlerId}`"
      frameBorder="0"
      allowfullscreen="true"
    ></iframe>
    <div
      v-else
      class="w-full h-full min-h-[20rem] bg-neutral-400 place-items-center"
    >
      <h3 class="text-3xl">No Asset File Found</h3>
      <p>{{ fileHandlerId }}</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import config from "@/config";

defineProps<{
  fileHandlerId: string | null;
}>();
</script>
