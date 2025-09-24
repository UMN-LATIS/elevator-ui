<template>
  <component
    :is="href ? 'a' : 'div'"
    :href="href"
    class="thumbnail-image block rounded overflow-hidden w-24 aspect-square relative border border-transparent-black-200 shadow-sm group transition-all">
    <div
      v-if="showHoverIcon"
      class="thumbnail-image__icon absolute z-10 bg-transparent-white-500 rounded-full w-12 h-12 flex justify-center items-center backdrop-blur-sm top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 scale-0 group-hover:scale-100 transition-all">
      <ArrowForwardIcon class="text-neutral-900" />
    </div>
    <LazyLoadImage
      :src="src"
      :alt="alt"
      class="w-full h-full app-object-fit transition-all"
      :class="{
        'group-hover:scale-110 group-hover:opacity-100 opacity-80':
          showHoverIcon,
      }" />
    <div
      v-if="isVideo || isAudio"
      class="backdrop-blur-md bg-transparent-white-500 text-neutral-900 flex absolute bottom-1 right-1 z-10 rounded-full justify-center items-center p-1 w-6 h-6">
      <AudioIcon v-if="isAudio" />
      <VideoIcon v-if="isVideo" />
    </div>
    <slot />
  </component>
</template>
<script setup lang="ts">
import { computed } from "vue";
import LazyLoadImage from "@/components/LazyLoadImage/LazyLoadImage.vue";
import { ArrowForwardIcon, AudioIcon, VideoIcon } from "@/icons";

const props = withDefaults(
  defineProps<{
    src: string;
    alt: string | null;
    href?: string;
    fileType?: string | undefined;
    showHoverIcon?: boolean;
  }>(),
  {
    href: undefined,
    fileType: undefined,
    showHoverIcon: true,
  }
);

// this should match the list in the backend
// AudioHandler and MovieHandler
const supportedAudioTypes = ["mp3", "aiff", "aif", "m4a", "wav", "wave", "wma"];
const supportedVideoTypes = [
  "mov",
  "mp4",
  "m4v",
  "mts",
  "mkv",
  "avi",
  "mpeg",
  "mpg",
  "m2t",
  "m2ts",
  "dv",
  "vob",
  "mxf",
  "wmv",
];

const isVideo = computed((): boolean => {
  if (!props.fileType) return false;
  return supportedVideoTypes.includes(props.fileType.toLowerCase());
});

const isAudio = computed((): boolean => {
  if (!props.fileType) return false;
  return supportedAudioTypes.includes(props.fileType.toLowerCase());
});
</script>
<style scoped>
.thumbnail-image--is-active {
  --tw-ring-color: var(--app-thumbnailImage-active-ringColor);
}
</style>
