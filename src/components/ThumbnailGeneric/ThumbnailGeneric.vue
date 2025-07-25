<template>
  <div
    class="thumbnail-generic aspect-square hover:shadow-md border-transparent-black-200 hover:opacity-100 group relative inline-flex flex-col items-center justify-center w-24 transition-all border rounded shadow-sm opacity-75"
    :class="{
      'thumbnail-generic--is-active ring ring-offset-1 ring-blue-600': isActive,
    }">
    <div
      class="thumbnail-image__icon bg-transparent-white-500 backdrop-blur-sm top-1/2 left-1/2 group-hover:scale-100 absolute z-10 flex items-center justify-center w-12 h-12 transition-all scale-0 -translate-x-1/2 -translate-y-1/2 rounded-full">
      <ArrowForwardIcon class="text-neutral-900" />
    </div>
    <div
      class="group-hover:scale-110 flex flex-col items-center justify-center transition-all">
      <DocumentIcon class="thumbnail-generic__icon" />
      <div
        class="whitespace-nowrap text-ellipsis max-w-full px-2 overflow-hidden text-xs">
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
