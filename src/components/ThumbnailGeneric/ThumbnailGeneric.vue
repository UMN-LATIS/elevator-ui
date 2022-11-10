<template>
  <div
    class="thumbnail-generic w-24 aspect-square inline-flex justify-center items-center flex-col border rounded hover:shadow-md relative border-transparent-black-200 shadow-sm opacity-75 hover:opacity-100 group transition-all"
    :class="{
      'thumbnail-generic--is-active ring ring-offset-1 ring-blue-600': isActive,
    }"
  >
    <div
      class="thumbnail-image__icon absolute z-10 bg-transparent-white-500 rounded-full w-12 h-12 flex justify-center items-center backdrop-blur-sm top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 scale-0 group-hover:scale-100 transition-all"
    >
      <ArrowForwardIcon class="text-neutral-900" />
    </div>
    <div
      class="group-hover:scale-110 flex flex-col justify-center items-center transition-all"
    >
      <DocumentIcon class="thumbnail-generic__icon" />
      <div
        class="text-xs overflow-hidden max-w-full whitespace-nowrap px-2 text-ellipsis"
      >
        <slot />
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import DocumentIcon from "@/icons/DocumentIcon.vue";
import ArrowForwardIcon from "@/icons/ArrowForwardIcon.vue";

defineProps<{
  isActive?: boolean;
}>();
</script>
<style scoped>
.thumbnail-generic {
  border-color: var(--app-thumbnailImage-borderColor);
  background: var(--app-thumbnailImage-backgroundColor);
  color: var(--app-thumbnailImage-textColor);
}

.thumbnail-generic--is-active {
  --tw-ring-color: var(--app-thumbnailImage-active-ringColor);
}
</style>
