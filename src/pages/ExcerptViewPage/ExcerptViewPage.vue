<template>
  <NoScrollLayout>
    <Transition name="fade">
      <div
        v-if="excerpt"
        class="p-4 lg:p-8 mx-auto flex-1 w-full max-w-screen-xl"
      >
        <h1 class="text-4xl font-bold my-8">
          {{ excerpt.label || `Excerpt ${excerpt.id}` }}
        </h1>

        <iframe
          ref="videoPlayerIframe"
          :src="excerpt.embedUrl"
          class="w-full aspect-video"
          @load="isVideoPlayerLoaded = true"
        />
      </div>
    </Transition>
  </NoScrollLayout>
</template>
<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import api from "@/api";
import { ApiGetExcerptResponse } from "@/types";
import NoScrollLayout from "@/layouts/NoScrollLayout.vue";

const props = defineProps<{
  excerptId: number;
}>();

const excerpt = ref<ApiGetExcerptResponse | null>(null);
const videoPlayerIframe = ref<HTMLIFrameElement | null>(null);
const isVideoPlayerLoaded = ref(false);

function setVideoPlayBounds(startTime: number, endTime: number) {
  if (!videoPlayerIframe.value?.contentWindow) {
    throw new Error("videoPlayerIframe is not loaded");
  }

  // send a message to the iframe to set the play bounds
  videoPlayerIframe.value.contentWindow?.postMessage(
    {
      type: "setPlayBounds",
      startTime,
      endTime,
    },
    "*"
  );
}
watch(isVideoPlayerLoaded, () => {
  if (!isVideoPlayerLoaded.value) return;

  if (!excerpt.value) {
    throw new Error("excerpt is not loaded.");
  }
  setVideoPlayBounds(excerpt.value.startTime, excerpt.value.endTime);
});

onMounted(async () => {
  excerpt.value = await api.getExcerpt(props.excerptId);
});
</script>
<style scoped></style>
