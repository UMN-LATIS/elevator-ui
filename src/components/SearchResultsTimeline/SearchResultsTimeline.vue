<template>
  <div class="search-results-timeline">
    <div id="timeline-embed"></div>
  </div>
</template>
<script setup lang="ts">
import { onMounted } from "vue";
import { SearchResultMatch } from "@/types";
import { Timeline } from "@knight-lab/timelinejs";

import "@knight-lab/timelinejs/dist/css/timeline.css";
import { convertMatchesToTimelineJSSlides } from "@/helpers/timelineHelpers";

const props = defineProps<{
  matches: SearchResultMatch[];
}>();

defineEmits<{
  (event: "loadMore");
}>();

onMounted(() => {
  const slides = convertMatchesToTimelineJSSlides(props.matches);
  new Timeline(
    "timeline-embed",
    { events: slides },
    {
      timenav_position: "bottom",
      timenav_height_percentage: 50,
      start_at_end: true,
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
