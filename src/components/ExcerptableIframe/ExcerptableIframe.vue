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
import { ref, inject, watch } from "vue";
import config from "@/config";
import {
  useIframeMessaging,
  responseTypes,
  requestTypes,
} from "@/helpers/useiFrameMessaging";
import { AddToDrawerIsModelOpenKey } from "@/constants/constants";

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

// if this modal is within the AddToDrawerModal, pause the video on any modal state change
const isAddToDrawerModalOpen = inject(AddToDrawerIsModelOpenKey);
if (isAddToDrawerModalOpen) {
  watch(isAddToDrawerModalOpen, () => {
    // pause the video on any modal state change
    iframeMessaging.postMessage({
      type: requestTypes.PAUSE_PLAYER,
    });
  });
}
</script>

<style scoped></style>
