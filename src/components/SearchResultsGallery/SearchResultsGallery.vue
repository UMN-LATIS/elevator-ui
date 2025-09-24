<template>
  <div
    ref="galleryEl"
    class="search-results-gallery"
    :class="{
      'h-screen flex flex-col items-center justify-center': isFullscreen,
    }">
    <div
      v-if="mainSwiper"
      class="flex items-center justify-between w-full gap-4"
      :class="{
        'p-4': isFullscreen,
        'py-2': !isFullscreen,
      }">
      <h2 class="font-bold">
        <Link
          v-if="activeSlide.objectId"
          :to="getAssetUrl(activeSlide.objectId)"
          class="transition-colors hover:text-blue-600 !no-underline"
          :class="{
            'text-neutral-300 text-4xl ': isFullscreen,
            'text-xl text-blue-700 ': !isFullscreen,
          }">
          {{ activeSlide.title }}
        </Link>
      </h2>
      <FullscreenButton
        :isFullscreen="isFullscreen"
        @click="toggleFullscreen" />
    </div>
    <Swiper
      class="main-swiper flex-1"
      :modules="modules"
      :slidesPerView="1"
      :spaceBetween="50"
      :thumbs="{ swiper: thumbsSwiper as SwiperType }"
      :keyboard="{ enabled: true, onlyInViewport: false }"
      @swiper="setMainSwiper"
      @slideChange="onMainSlideChange">
      <SwiperSlide
        v-for="slide in slides"
        :key="slide.id"
        v-slot="{ isActive, isPrev, isNext }">
        <div class="w-full h-full border">
          <ObjectViewer
            v-if="slide.primaryHandlerId && (isActive || isPrev || isNext)"
            class="border w-full h-full"
            :fileHandlerId="slide.primaryHandlerId" />
          <div
            v-else
            class="w-full h-full flex items-center justify-center -mt-12">
            <DocumentIcon />
          </div>
        </div>
      </SwiperSlide>
    </Swiper>

    <!-- Thumbs Swiper -> store swiper instance -->
    <!-- It is also required to set watchSlidesProgress prop -->
    <Swiper
      class="thumbs-swiper w-full"
      :modules="[Thumbs, Scrollbar]"
      :watchSlidesProgress="true"
      :slidesPerView="10"
      :centeredSlides="true"
      :scrollbar="{ draggable: true, dragSize: 32 }"
      :spaceBetween="4"
      @swiper="setThumbsSwiper"
      @touchEnd="onThumbSlideChange"
      @scrollbarDragEnd="onThumbSlideChange">
      <SwiperSlide v-for="(slide, i) in slides" :key="slide.id">
        <div
          class="border border-neutral-400 aspect-video flex items-center justify-center w-full relative">
          <div
            v-if="i !== activeSlideIndex"
            class="absolute bottom-0 left-0 w-6 h-6 text-xs z-10 flex items-center justify-center bg-transparent-white-800 text-neutral-900">
            {{ i + 1 }}
          </div>
          <LazyLoadImage
            v-if="slide.thumb.src"
            :src="slide.thumb.src"
            :alt="slide.thumb.alt ?? 'Loading...'"
            class="swiper-lazy app-object-fit w-full h-full" />
          <DocumentIcon v-else />
        </div>
      </SwiperSlide>
    </Swiper>

    <div
      v-if="mainSwiper"
      class="flex items-center justify-center mb-1 relative py-4"
      :class="{
        'text-neutral-50': isFullscreen,
        'text-neutral-900': !isFullscreen,
      }">
      <Button
        variant="tertiary"
        class="!m-0 bg-transparent hover:!bg-transparent-white-500"
        :class="{
          'opacity-30': activeSlideIndex === 0,
        }"
        @click="mainSwiper.slidePrev()">
        <ChevronLeftIcon
          :class="{
            'text-neutral-50': isFullscreen,
            'text-neutral-900': !isFullscreen,
          }" />
      </Button>
      <div
        class="flex flex-col items-center justify-center text-xs text-center px-4 py-2">
        {{ activeSlideIndex + 1 }}
      </div>

      <Button
        variant="tertiary"
        class="!m-0 bg-transparent hover:!bg-transparent-white-500"
        @click="mainSwiper.slideNext()">
        <ChevronRightIcon
          :class="{
            'text-neutral-50 ': isFullscreen,
            'text-neutral-900': !isFullscreen,
          }" />
      </Button>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, computed, watch, useTemplateRef } from "vue";
import { Swiper, SwiperSlide } from "swiper/vue";
import { type Swiper as SwiperType } from "swiper";
import { Navigation, Scrollbar, A11y, Thumbs, Keyboard } from "swiper";
import { SearchResultMatch } from "@/types";
import DocumentIcon from "@/icons/DocumentIcon.vue";
import { getAssetUrl } from "@/helpers/displayUtils";
import LazyLoadImage from "@/components/LazyLoadImage/LazyLoadImage.vue";
import Button from "@/components/Button/Button.vue";
import ObjectViewer from "../ObjectViewer/ObjectViewer.vue";
import Link from "../Link/Link.vue";
import { ChevronLeftIcon, ChevronRightIcon } from "@/icons";
import { useSlidesForMatches, type Slide } from "./useSlidesForMatches";
import { difference } from "ramda";
import FullscreenButton from "@/components/FullscreenButton/FullscreenButton.vue";
import { useFullscreen } from "@vueuse/core";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/scrollbar";
import "swiper/css/thumbs";

const props = defineProps<{
  totalResults: number;
  matches: SearchResultMatch[] | null;
  status: string;
}>();

const emit = defineEmits<{
  (event: "loadMore");
}>();

const modules = [Navigation, Scrollbar, A11y, Thumbs, Keyboard];
const thumbsSwiper = ref<SwiperType | null>(null);
const mainSwiper = ref<SwiperType | null>(null);
const galleryEl = useTemplateRef("galleryEl");
const { isFullscreen, toggle: toggleFullscreen } = useFullscreen(galleryEl);
const { slides, createSlidesForMatch } = useSlidesForMatches([]);

const activeSlideIndex = ref(0);
const activeSlide = computed((): Slide => {
  return slides[activeSlideIndex.value];
});

const setThumbsSwiper = (swiper: SwiperType) => {
  thumbsSwiper.value = swiper;
};

const setMainSwiper = (swiper) => {
  mainSwiper.value = swiper;
};

const onMainSlideChange = (mainSwiper: SwiperType) => {
  activeSlideIndex.value = mainSwiper.activeIndex;
  // center the active slide in the thumbs swiper
  if (!thumbsSwiper.value) return;
  thumbsSwiper.value.slideTo(mainSwiper.activeIndex);
};

const onThumbSlideChange = (thumbsSwiper: SwiperType) => {
  activeSlideIndex.value = thumbsSwiper.activeIndex;
  mainSwiper.value?.slideTo(thumbsSwiper.activeIndex);
};

watch(
  // we do this spread biznez so that oldMatches and newMatches are not the
  // same reference. ...props.matches makes a shallow copy of the contents,
  // while the oldMatches is a reference to the previous value of props.matches
  () => [...(props.matches ?? [])],
  (newMatches, oldMatches) => {
    if (!newMatches) return;
    const matchesDiff = difference(newMatches, oldMatches ?? []);
    matchesDiff.forEach(createSlidesForMatch);
  },
  { immediate: true }
);

watch(activeSlideIndex, () => {
  if (!props.matches) return;

  if (props.status === "fetching") return;

  // if there are more results to load, emit a load more event
  const hasMoreResults = props.matches.length < props.totalResults;
  const closeToEnd = activeSlideIndex.value >= slides.length - 10;

  if (hasMoreResults && closeToEnd) {
    emit("loadMore");
  }
});
</script>
<style>
.main-swiper {
  width: 100%;
  height: 60vh;
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

.thumbs-swiper {
  --swiper-scrollbar-size: 0.5rem;
  --swiper-scrollbar-bottom: -0rem;
  --swiper-scrollbar-bg-color: rgba(0, 0, 0, 0.1);
  --swiper-scrollbar-drag-bg-color: rgba(0, 0, 0, 0.5);
}

.thumbs-swiper .swiper-slide {
  width: 25%;
  height: 100%;
  opacity: 0.25;
}

.thumbs-swiper .swiper-slide-active {
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
