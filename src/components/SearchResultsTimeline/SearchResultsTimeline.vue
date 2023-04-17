<template>
  <div class="search-results-timeline">
    <div class="flex gap-2 my-4 items-baseline justify-end">
      <p v-if="status === 'success' && matches.length > 0" class="text-xs">
        {{ matches.length }} of {{ totalResults }} results
      </p>
      <Button
        v-if="
          status === 'success' &&
          matches.length > 0 &&
          matches.length < totalResults
        "
        variant="tertiary"
        @click="$emit('loadMore')"
      >
        Load More
      </Button>
    </div>
    <div id="timeline-embed"></div>
  </div>
</template>
<script setup lang="ts">
import { onMounted } from "vue";
import { SearchResultMatch } from "@/types";
import { Timeline } from "@knight-lab/timelinejs";
import Button from "../Button/Button.vue";

import "@knight-lab/timelinejs/dist/css/timeline.css";
import { convertMatchesToTimelineJSSlides } from "@/helpers/timelineHelpers";

const props = defineProps<{
  totalResults: number;
  matches: SearchResultMatch[];
  status: string;
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
