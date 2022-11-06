<template>
  <section class="drawer flex flex-col overflow-auto">
    <header
      class="flex items-center sticky top-0 left-0 justify-between z-10 bg-app-panel-header text-app-panel-header backdrop-blur-[2px] border-b-app border-b-app-panel-header-bottom"
      :class="{
        'h-full': !isOpen,
      }"
    >
      <button
        :disabled="!showToggle"
        class="flex items-center p-4 leading-tight gap-4 flex-1"
        @click="$emit('toggle')"
      >
        <span v-if="showToggle">
          <ChevronDownIcon v-if="isOpen" class="w-5 h-5" />
          <ChevronUpIcon v-if="!isOpen" class="w-5 h-5" />
        </span>
        <slot name="header-label">
          <DrawerLabel :label="label" :isOpen="isOpen" />
        </slot>
      </button>

      <div>
        <slot name="header-utils"></slot>
      </div>
    </header>

    <div
      v-show="isOpen"
      class="text-app-panel-body flex flex-col gap-app-panel-items px-4 md:p-8 flex-1 bg-app-assetPanel-body"
    >
      <slot />
    </div>
  </section>
</template>
<script setup lang="ts">
import DrawerLabel from "./DrawerLabel.vue";
import ChevronDownIcon from "@/icons/ChevronDownIcon.vue";
import ChevronUpIcon from "@/icons/ChevronUpIcon.vue";

withDefaults(
  defineProps<{
    label: string;
    isOpen?: boolean;
    showToggle?: boolean;
  }>(),
  {
    isOpen: true,
    showToggle: true,
  }
);

defineEmits<{
  (eventName: "toggle");
}>();
</script>
<style scoped>
/* width */
::-webkit-scrollbar {
  width: 0.5rem;
}

/* Track */
::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 33%);
}

/* Handle */
::-webkit-scrollbar-thumb {
  background: #ccc;
}

/* Handle on hover */
::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>
