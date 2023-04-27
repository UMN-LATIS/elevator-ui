ty
<template>
  <div class="search-results-gallery mb-8">
    <div v-if="mainSwiper" class="flex items-center justify-between mb-1">
      <Button variant="tertiary" @click="mainSwiper.slidePrev()">
        <ChevronLeftIcon />
        Previous
      </Button>
      <div class="flex flex-col items-center justify-center">
        <span class="text-xs">
          {{ activeSlideIndex + 1 }} / {{ slides.length }}
        </span>
        <h2>
          <Link :to="getAssetUrl(activeSlide.objectId)">
            {{ activeSlide.title }}
          </Link>
        </h2>
      </div>

      <Button variant="tertiary" @click="mainSwiper.slideNext()">
        Next
        <ChevronRightIcon />
      </Button>
    </div>
    <Swiper
      class="main-swiper"
      :modules="modules"
      :slidesPerView="1"
      :spaceBetween="50"
      :scrollbar="{ draggable: true }"
      :thumbs="{ swiper: thumbsSwiper }"
      @swiper="setMainSwiper"
      @slideChange="onSlideChange"
    >
      <SwiperSlide
        v-for="(slide, i) in slides"
        :key="i"
        v-slot="{ isActive, isPrev, isNext }"
      >
        <div class="w-full h-full border">
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
import LazyLoadImage from "@/components/LazyLoadImage/LazyLoadImage.vue";
import Button from "@/components/Button/Button.vue";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/scrollbar";
import "swiper/css/thumbs";
import ObjectViewer from "../ObjectViewer/ObjectViewer.vue";
import Link from "../Link/Link.vue";
import { ChevronLeftIcon, ChevronRightIcon } from "@/icons";

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
const mainSwiper = ref<typeof Swiper | null>(null);

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

const activeSlide = computed((): Slide => {
  const activeIndex = mainSwiper.value?.activeIndex ?? 0;
  return slides.value[activeIndex];
});

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
  thumbsSwiper.value = swiper;
};

const setMainSwiper = (swiper) => {
  mainSwiper.value = swiper;
};
const onSlideChange = (args) => {
  console.log("slide change", { args });
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
