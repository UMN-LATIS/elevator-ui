<template>
  <NoScrollLayout>
    <Transition name="fade">
      <div
        v-if="excerpt"
        class="p-4 lg:p-8 mx-auto flex-1 w-full max-w-screen-xl"
      >
        <header class="flex justify-between items-baseline my-4 flex-wrap">
          <h1 class="text-4xl font-bold flex-1">
            {{ excerpt.label || `Excerpt ${excerpt.id}` }}
          </h1>
          <Button variant="tertiary" :to="`/asset/viewAsset/${excerpt.assetId}`"
            >View Asset</Button
          >
        </header>

        <iframe
          ref="videoPlayerIframe"
          :src="`${config.instance.base.url}/asset/getEmbed/${excerpt.fileObjectId}`"
          frameBorder="0"
          allowfullscreen="true"
          class="w-full aspect-video"
        />
        <div class="flex justify-between p-1 items-center flex-wrap">
          <div class="inline-flex gap-2 items-center">
            <span class="font-bold text-xs uppercase">Time</span>
            <span class="text-sm">
              {{ secondsToTimeString(excerpt.startTime) }} -
              {{ secondsToTimeString(excerpt.endTime) }}
            </span>
          </div>
          <div>
            <MoreFileInfoButton :fileObjectId="excerpt.fileObjectId" />
            <DownloadFileButton
              :assetId="excerpt.assetId"
              :fileObjectId="excerpt.fileObjectId"
            />
            <ShareFileButton :fileObjectId="excerpt.fileObjectId" />
          </div>
        </div>
      </div>
    </Transition>
  </NoScrollLayout>
</template>
<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import api from "@/api";
import { ApiGetExcerptResponse } from "@/types";
import NoScrollLayout from "@/layouts/NoScrollLayout.vue";
import config from "@/config";
import { secondsToTimeString } from "@/helpers/excerptHelpers";
import MoreFileInfoButton from "@/components/MoreFileInfoButton/MoreFileInfoButton.vue";
import DownloadFileButton from "@/components/DownloadFileButton/DownloadFileButton.vue";
import Button from "@/components/Button/Button.vue";
import ShareFileButton from "@/components/ShareFileButton/ShareFileButton.vue";

interface ResponseMessageEvent extends MessageEvent {
  data: {
    type: keyof typeof responses;
    payload: unknown;
  };
}

const props = defineProps<{
  excerptId: number;
}>();

const excerpt = ref<ApiGetExcerptResponse | null>(null);
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

function iFrameResponseHandler(event: ResponseMessageEvent) {
  if (!excerpt.value) {
    throw new Error("excerpt is not loaded.");
  }

  log(
    "message received:",
    event.data.type ?? "unknown type",
    event.data.payload ?? ""
  );
  const { type } = event.data;
  if (type === responses.MEDIAPLAYER_READY) {
    return setVideoPlayBounds(
      excerpt.value.startTime || 0,
      excerpt.value.endTime || 0
    );
  }
  if (type === responses.CURRENT_SCRUBBER_POSITION) {
    return log("current scrubber position", event.data.payload);
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

function setVideoPlayBounds(startTime: number, endTime: number) {
  postMessage<{ startTime: number; endTime: number }>({
    type: requests.SET_PLAY_BOUNDS,
    payload: {
      startTime,
      endTime,
    },
  });
}

onMounted(async () => {
  window.addEventListener("message", iFrameResponseHandler);
  excerpt.value = await api.getExcerpt(props.excerptId);
  console.log("excerpt", excerpt.value);
});
</script>
<style scoped></style>
