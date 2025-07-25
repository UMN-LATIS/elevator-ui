<template>
  <div class="search-results-timeline">
    <div
      v-if="!slides.length"
      class="flex flex-col items-center justify-center py-16 gap-4">
      <h2 class="text-2xl font-medium">No Timeline Events</h2>

      <p>The loaded results don't have dates, so we can't make a timeline.</p>
      <Button v-if="matches.length < totalResults" @click="$emit('loadMore')">
        Load More
        <SpinnerIcon v-if="status === 'fetching'" class="w-4 h-4 ml-2" />
      </Button>
    </div>
    <div id="timeline-embed" ref="timelineEmbed"></div>
  </div>
</template>
<script setup lang="ts">
import { onMounted, ref, onUnmounted } from "vue";
import { SearchResultMatch, TimelineJSSlide } from "@/types";
import { Timeline } from "@knight-lab/timelinejs";
import { convertMatchesToTimelineJSSlides } from "@/helpers/timelineHelpers";
import Button from "@/components/Button/Button.vue";
import "@knight-lab/timelinejs/dist/css/timeline.css";
import SpinnerIcon from "@/icons/SpinnerIcon.vue";

const props = defineProps<{
  totalResults: number;
  matches: SearchResultMatch[];
  status: string;
}>();

defineEmits<{
  (event: "loadMore");
}>();

const slides = ref<TimelineJSSlide[]>([]);
const timelineInstance = ref<Timeline | null>(null);
const timelineEmbed = ref<HTMLElement | null>(null);

function removeEventListeners(element) {
  const clone = element.cloneNode(true);
  element.parentNode.replaceChild(clone, element);
  return clone;
}

onMounted(() => {
  slides.value = convertMatchesToTimelineJSSlides(props.matches);
  if (!slides.value.length) return;
  timelineInstance.value = new Timeline(
    "timeline-embed",
    { events: slides.value },
    {
      timenav_position: "bottom",
      timenav_height_percentage: 50,
      start_at_end: true,
    }
  );
});

onUnmounted(() => {
  if (timelineEmbed.value) {
    timelineEmbed.value.innerHTML = "";
    removeEventListeners(timelineEmbed.value);
  }
});
</script>
<style scoped>
#timeline-embed {
  width: 100%;
  height: 75vh;
}
</style>
