<template>
  <component
    :is="href ? 'a' : 'div'"
    :href="href"
    class="thumbnail-image block rounded overflow-hidden hover:shadow-md w-24 aspect-square relative border border-transparent-black-200 shadow-sm"
    :class="{
      'ring ring-offset-1 ring-blue-600': isActive,
    }"
  >
    <div
      v-if="iconOnHover"
      class="thumbnail-image__icon absolute z-10 bg-transparent-white-500 rounded-full w-12 h-12 flex justify-center items-center backdrop-blur-sm top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-opacity duration-300 opacity-0"
    >
      <Icon class="text-neutral-900">{{ iconOnHover }}</Icon>
    </div>
    <img
      :src="src"
      class="thumbnail-image__img w-full h-full object-cover opacity-80 transition-all ease-in"
      :alt="alt"
    />
    <slot />
  </component>
</template>
<script setup lang="ts">
import Icon from "@/components/Icon/Icon.vue";

withDefaults(
  defineProps<{
    src: string;
    alt: string;
    href?: string;
    iconOnHover?: string;
    isActive?: boolean;
  }>(),
  {
    href: undefined,
    iconOnHover: undefined,
    isActive: false,
  }
);
</script>
<style scoped>
.thumbnail-image:hover .thumbnail-image__img {
  transform: scale(1.05);
  opacity: 1;
}
.thumbnail-image:hover .thumbnail-image__icon {
  opacity: 1;
}
</style>
