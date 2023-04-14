<template>
  <div class="search-results-timeline">
    <div id="timeline-embed"></div>
  </div>
</template>
<script setup lang="ts">
import { ref } from "vue";
import { FetchStatus, SearchResultMatch } from "@/types";
import { Timeline } from "@knight-lab/timelinejs";

import "@knight-lab/timelinejs/dist/css/timeline.css";
import { onMounted } from "vue";

import { mockTimelineJSEvents } from "@/__mocks__/mockTimelineJSEvents";

defineProps<{
  totalResults?: number;
  matches: SearchResultMatch[];
  status: FetchStatus;
}>();

defineEmits<{
  (event: "loadMore");
}>();

const timeline = ref<Timeline | null>(null);

onMounted(() => {
  timeline.value = new Timeline(
    "timeline-embed",
    {
      events: mockTimelineJSEvents,
    },
    {
      timenav_position: "bottom",
      timenav_height_percentage: 50,
    }
  );
});
</script>
<style scoped>
#timeline-embed {
  width: 100%;
  height: 75vh;
}
</style>
