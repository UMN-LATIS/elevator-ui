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
import { ref } from "vue";
import config from "@/config";
import {
  useIframeMessaging,
  responseTypes,
  requestTypes,
} from "@/helpers/useiFrameMessaging";

interface ResponseMessageEvent extends MessageEvent {
  data: {
    type: keyof typeof responseTypes;
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
const currentScrubberPosition = ref<number>(0);
const iframeMessaging = useIframeMessaging(videoPlayerIframe);

iframeMessaging.addResponseHandler((event: ResponseMessageEvent) => {
  const { type } = event.data;
  if (type === responseTypes.MEDIAPLAYER_READY) {
    return iframeMessaging.postMessage({
      type: requestTypes.SET_PLAY_BOUNDS,
      payload: {
        startTime: props.startTime,
        endTime: props.endTime,
      },
    });
  }
  if (type === responseTypes.CURRENT_SCRUBBER_POSITION) {
    currentScrubberPosition.value = event.data.payload as number;
    return emit("update:currentScrubberPosition", event.data.payload as number);
  }
  if (type === responseTypes.SET_PLAY_BOUNDS_SUCCESS) {
    return emit("ready");
  }
});
</script>

<style scoped></style>
