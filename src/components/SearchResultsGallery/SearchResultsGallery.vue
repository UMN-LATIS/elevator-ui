ty
<template>
  <div class="search-results-gallery mb-8">
    <!-- Main Swiper -> pass thumbs swiper instance -->
    <Swiper
      class="main-swiper"
      :modules="modules"
      :slidesPerView="1"
      :spaceBetween="50"
      navigation
      :scrollbar="{ draggable: true }"
      :thumbs="{ swiper: thumbsSwiper }"
      @swiper="onSwiper"
      @slideChange="onSlideChange"
    >
      <SwiperSlide
        v-for="(slide, i) in slides"
        :key="i"
        v-slot="{ isActive, isPrev, isNext }"
      >
        <div class="w-full h-full border">
          <h2 class="my-4">
            <Link :to="getAssetUrl(slide.objectId)">{{ slide.title }}</Link>
          </h2>
          <ObjectViewer
            v-if="slide.primaryHandlerId && (isActive || isPrev || isNext)"
            class="border w-full h-full"
            :fileHandlerId="slide.primaryHandlerId"
          />
          <div
            v-else
            class="w-full h-full flex items-center justify-center -mt-12"
          >
            <DocumentIcon />
          </div>
        </div>
      </SwiperSlide>
    </Swiper>

    <!-- Thumbs Swiper -> store swiper instance -->
    <!-- It is also required to set watchSlidesProgress prop -->
    <Swiper
      class="thumbs-swiper w-full"
      :modules="[Thumbs]"
      :watchSlidesProgress="true"
      :slidesPerView="10"
      :spaceBetween="4"
      @swiper="setThumbsSwiper"
    >
      <SwiperSlide v-for="(slide, i) in slides" :key="i">
        <div
          class="border border-neutral-400 aspect-video flex items-center justify-center w-full"
        >
          <LazyLoadImage
            v-if="slide.thumb.src"
            :src="slide.thumb.src"
            :alt="slide.thumb.alt"
            class="swiper-lazy object-cover w-full h-full"
          />
          <DocumentIcon v-else />
        </div>
      </SwiperSlide>
    </Swiper>
  </div>
</template>
<script setup lang="ts">
import { ref, computed } from "vue";
import { Swiper, SwiperSlide } from "swiper/vue";
import { Navigation, Scrollbar, A11y, Thumbs } from "swiper";
import { SearchResultMatch } from "@/types";
import DocumentIcon from "@/icons/DocumentIcon.vue";
import { getAssetUrl, getThumbURL } from "@/helpers/displayUtils";
import LazyLoadImage from "../LazyLoadImage/LazyLoadImage.vue";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/scrollbar";
import "swiper/css/thumbs";
import ObjectViewer from "../ObjectViewer/ObjectViewer.vue";
import Link from "../Link/Link.vue";

const props = defineProps<{
  totalResults: number;
  matches: SearchResultMatch[];
  status: string;
}>();

defineEmits<{
  (event: "loadMore");
}>();

const modules = [Navigation, Scrollbar, A11y, Thumbs];
const thumbsSwiper = ref(null);

interface Slide {
  title: string;
  objectId: string;
  primaryHandlerId: string | null;
  thumb: {
    src: string | null;
    alt: string;
  };
}
const slides = computed((): Slide[] =>
  props.matches.map(
    (match): Slide => ({
      objectId: match.objectId,
      primaryHandlerId: match.primaryHandlerId ?? null,
      title: selectTitleFromMatch(match),
      thumb: {
        src: selectThumbSrc(match),
        alt: selectTitleFromMatch(match),
      },
    })
  )
);
const selectTitleFromMatch = (match: SearchResultMatch) => {
  const noTitleText = "No Title";
  if (Array.isArray(match.title)) {
    return match.title?.[0] ?? noTitleText;
  }
  return match.title ?? noTitleText;
};

const selectThumbSrc = (match: SearchResultMatch) => {
  const { primaryHandlerId } = match;
  return primaryHandlerId ? getThumbURL(primaryHandlerId) : null;
};

const setThumbsSwiper = (swiper) => {
  console.log(swiper);
  thumbsSwiper.value = swiper;
};

const onSwiper = (swiper) => {
  console.log(swiper);
};
const onSlideChange = () => {
  console.log("slide change");
};
</script>
<style scoped>
.main-swiper {
  width: 100%;
  height: 50vh;
}

.swiper-slide {
  text-align: center;
  font-size: 18px;
  background: #fff;

  /* Center slide text vertically */
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}

.thumbs-swiper .swiper-slide {
  width: 25%;
  height: 100%;
  opacity: 0.25;
}

.thumbs-swiper .swiper-slide-thumb-active {
  opacity: 1;
  border: 2px solid #0d6efd;
}

.swiper-slide img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
