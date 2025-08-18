<template>
  <div class="slides-test-page mb-8">
    <h1>Slides Test Page</h1>
    <div v-if="mainSwiper" class="flex items-center justify-between mb-1">
      <Button variant="tertiary" @click="mainSwiper.slidePrev()">
        <ChevronLeftIcon />
        Previous
      </Button>
      <div class="flex flex-col items-center justify-center">
        <h2>
          {{ activeSlide.title }}
        </h2>
        <span class="text-xs">
          {{ activeSlideIndex + 1 }} / {{ slides.length }}
        </span>
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
      :thumbs="{ swiper: thumbsSwiper as SwiperType }"
      @swiper="setMainSwiper"
      @slideChange="onMainSlideChange">
      <SwiperSlide v-for="(slide, i) in slides" :key="i">
        <div class="w-full h-full border">
          <h2 class="text-xl font-bold">{{ slide.title }}</h2>
          <img :src="slide.thumb.src" :alt="slide.thumb.alt" />
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
      :centeredSlides="true"
      :spaceBetween="4"
      @swiper="setThumbsSwiper">
      <SwiperSlide v-for="(slide, i) in slides" :key="i">
        <div
          class="border border-neutral-400 aspect-video flex items-center justify-center w-full">
          <LazyLoadImage
            v-if="slide.thumb.src"
            :src="slide.thumb.src"
            :alt="slide.thumb.alt ?? 'Loading...'"
            class="swiper-lazy object-cover w-full h-full" />
          <DocumentIcon v-else />
        </div>
      </SwiperSlide>
    </Swiper>
  </div>
</template>
<script setup lang="ts">
import { ref, computed, reactive, onMounted } from "vue";
import { Swiper, SwiperSlide } from "swiper/vue";
import { type Swiper as SwiperType } from "swiper";
import { Navigation, Scrollbar, A11y, Thumbs } from "swiper";
import DocumentIcon from "@/icons/DocumentIcon.vue";
import Button from "@/components/Button/Button.vue";
import { ChevronLeftIcon, ChevronRightIcon } from "@/icons";
import LazyLoadImage from "@/components/LazyLoadImage/LazyLoadImage.vue";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/scrollbar";
import "swiper/css/thumbs";

defineEmits<{
  (event: "loadMore");
}>();

const modules = [Navigation, Scrollbar, A11y, Thumbs];
const thumbsSwiper = ref<SwiperType | null>(null);
const mainSwiper = ref<SwiperType | null>(null);

interface Slide {
  title: string;
  thumb: {
    src: string;
    alt?: string;
  };
}

const slides = reactive([] as Slide[]);

// this is taked from the main swiper on updated on slide change
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
const onMainSlideChange = (args) => {
  activeSlideIndex.value = args.activeIndex;
  // center the active slide in the thumbs swiper
  if (!thumbsSwiper.value) return;
  thumbsSwiper.value.slideTo(args.activeIndex);
};

onMounted(() => {
  const createSlide = (n: number) => ({
    title: `Slide ${n}`,
    thumb: {
      src: `https://picsum.photos/id/${n}/500/300`,
      alt: `Slide ${n}`,
    },
  });

  const createPlaceholderSlide = (n: number) => ({
    title: `Placeholder Slide ${n}`,
    thumb: {
      src: "https://placehold.it/500x300",
      alt: `Slide ${n}`,
    },
  });

  // create 10 placeholder slides
  for (let i = 0; i < 10; i++) {
    slides.push(createPlaceholderSlide(i));
  }

  slides.forEach((slide, index) => {
    setTimeout(() => {
      slides[index] = createSlide(index);
    }, 1000 * index);
  });
});
</script>
<style>
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
