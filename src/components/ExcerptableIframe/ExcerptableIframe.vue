<template>
  <iframe
    ref="videoPlayerIframe"
    :src="`${config.instance.base.url}/asset/getEmbed/${fileObjectId}`"
    frameBorder="0"
    allowfullscreen="true"
    class="w-full aspect-video"
  >
    <slot />
  </iframe>
</template>
<script setup lang="ts">
import { ref, watch } from "vue";
import config from "@/config";

interface ResponseMessageEvent extends MessageEvent {
  data: {
    type: keyof typeof responses;
    payload: unknown;
  };
}

const props = defineProps<{
  fileObjectId: string;
  startTime?: number;
  endTime?: number;
}>();

const emit = defineEmits<{
  (eventName: "ready");
  (eventName: "update:currentScrubberPosition", currentTime: number);
}>();

const videoPlayerIframe = ref<HTMLIFrameElement | null>(null);

// set up messaging between the parent and the iframe
// see assets/js/excerpt.js for the iframe listener
const requests = {
  SET_PLAY_BOUNDS: "SET_PLAY_BOUNDS",
  GET_SCRUBBER_POSITION: "GET_SCRUBBER_POSITION",
} as const;

const responses = {
  MEDIAPLAYER_READY: "MEDIAPLAYER_READY",
  CURRENT_SCRUBBER_POSITION: "CURRENT_SCRUBBER_POSITION",
  SET_PLAY_BOUNDS_SUCCESS: "SET_PLAY_BOUNDS_SUCCESS",
} as const;

const log = (...args) => console.log("[PARENT] ", ...args);
const currentScrubberPosition = ref<number>(0);

function iFrameResponseHandler(event: ResponseMessageEvent) {
  log(
    "message received:",
    event.data.type ?? "unknown type",
    event.data.payload ?? ""
  );
  const { type } = event.data;
  if (type === responses.MEDIAPLAYER_READY) {
    return setVideoPlayBounds(props.startTime, props.endTime);
  }
  if (type === responses.CURRENT_SCRUBBER_POSITION) {
    currentScrubberPosition.value = event.data.payload as number;
    return emit("update:currentScrubberPosition", event.data.payload as number);
  }
  if (type === responses.SET_PLAY_BOUNDS_SUCCESS) {
    return log("set play bounds success");
  }
}

function postMessage<T>(message: { type: keyof typeof requests; payload?: T }) {
  const postMessageToIframe =
    videoPlayerIframe.value?.contentWindow?.postMessage;
  if (!postMessageToIframe) {
    throw new Error("videoPlayerIframe is not loaded");
  }
  postMessageToIframe(message, "*");
}

function setVideoPlayBounds(startTime?: number, endTime?: number) {
  if (startTime === undefined || endTime === undefined) {
    log("startTime or endTime is undefined. skipping setVideoPlayBounds");
    return;
  }

  postMessage<{ startTime: number; endTime: number }>({
    type: requests.SET_PLAY_BOUNDS,
    payload: {
      startTime,
      endTime,
    },
  });
}

watch(videoPlayerIframe, () => {
  if (videoPlayerIframe.value) {
    window.addEventListener("message", iFrameResponseHandler);
  }
});
</script>
<style scoped></style>
