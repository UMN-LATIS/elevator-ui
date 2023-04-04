<template>
  <div>
    <div
      class="rounded-md p-4 my-4 max-w-lg mx-auto border border-neutral-200 bg-white border-l-4"
      :class="{
        'border-l-blue-600': type === 'info',
        'border-l-yellow-300': type === 'warning',
        'border-l-red-400': type === 'error',
        'border-l-green-400': type === 'success',
      }"
    >
      <div class="flex">
        <div class="flex-shrink-0">
          <div
            class="rounded-full p-2"
            :class="{
              'bg-blue-100': type === 'info',
              'bg-yellow-100': type === 'warning',
              'bg-red-100': type === 'error',
              'bg-green-100': type === 'success',
            }"
          >
            <WarningIcon v-if="type === 'warning'" class="text-yellow-400" />
            <InfoIcon v-if="type === 'info'" class="text-blue-600" />
            <CircleCheckIcon v-if="type === 'success'" class="text-green-600" />
            <CircleXIcon v-if="type === 'error'" class="text-red-600" />
          </div>
        </div>
        <div class="ml-3">
          <h3 class="text-sm font-bold uppercase">
            {{ title }}
          </h3>
          <div class="mt-2 text-sm">
            <slot />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { WarningIcon, InfoIcon, CircleCheckIcon, CircleXIcon } from "@/icons";

withDefaults(
  defineProps<{
    title?: string;
    type?: "warning" | "info" | "error" | "success";
  }>(),
  {
    title: "Heads Up",
    type: "info",
  }
);
</script>
<style scoped></style>
