<template>
  <div class="search-results-timeline">
    <div id="timeline-embed"></div>
  </div>
</template>
<script setup lang="ts">
import { ref, watch } from "vue";
import { FetchStatus, SearchResultMatch } from "@/types";
import { Timeline } from "@knight-lab/timelinejs";

import "@knight-lab/timelinejs/dist/css/timeline.css";
import {
  convertMatchesToTimelineJSSlides,
  toTimelineJSSlide,
} from "@/helpers/timelineHelpers";

const props = defineProps<{
  totalResults?: number;
  matches: SearchResultMatch[];
  status: FetchStatus;
}>();

defineEmits<{
  (event: "loadMore");
}>();

const timeline = ref<Timeline | null>(null);

watch(
  () => props.matches,
  () => {
    if (props.matches.length === 0 || props.status !== "success") return;
    const slides = convertMatchesToTimelineJSSlides(props.matches);
    timeline.value = new Timeline(
      "timeline-embed",
      {
        events: slides,
      },
      {
        timenav_position: "bottom",
        timenav_height_percentage: 50,
      }
    );
  },
  { immediate: true }
);
</script>
<style scoped>
#timeline-embed {
  width: 100%;
  height: 75vh;
}
</style>
