<template>
  <NoScrollLayout>
    <Transition name="fade">
      <div
        v-if="excerpt"
        class="p-4 lg:p-8 mx-auto flex-1 w-full max-w-screen-xl"
      >
        <header class="mb-2 flex justify-between items-baseline">
          <h1 class="text-4xl font-bold mb-4 flex-1">
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
          @load="isVideoPlayerLoaded = true"
        />
        <div class="flex justify-between p-1 items-center">
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
  console.log("excerpt", excerpt.value);
});
</script>
<style scoped></style>
