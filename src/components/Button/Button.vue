<template>
  <component
    :is="href ? 'a' : 'button'"
    :href="href"
    :title="label"
    class="inline-flex items-center gap-1 no-underline hover:no-underline rounded justify-center leading-none transition-colors ease-in-out group"
    :class="{
      'bg-neutral-900 border-2 border-neutral-900 text-white hover:bg-blue-600 hover:border-blue-600 p-2 ':
        variant === 'primary',
      ' border-neutral-900 text-neutral-900 hover:text-blue-600 hover:border-blue-600 p-2 border-2 ':
        variant === 'secondary',
      'font-medium text-gray-700 text-sm hover:bg-blue-100 focus:bg-blue-100 hover:text-blue-800 focus:text-blue-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 px-2 bg-transparent-black-50':
        variant === 'tertiary',
      'flex-row-reverse': iconPosition === 'start',
    }"
    v-bind="$attrs"
  >
    <slot />
    <Icon
      v-if="icon"
      class="text-gray-400 text-xl group-hover:text-blue-800 group-focus:text-blue-800"
      aria-hidden="true"
      label="label"
    >
      {{ icon }}
    </Icon>
  </component>
</template>
<script setup lang="ts">
import Icon from "@/components/Icon/Icon.vue";

withDefaults(
  defineProps<{
    icon?: string;
    iconPosition?: "start" | "end";
    label?: string;
    href?: string;
    variant?: "primary" | "secondary" | "tertiary";
  }>(),
  {
    icon: undefined,
    variant: "secondary",
    label: undefined,
    href: undefined,
    iconPosition: "end",
  }
);
</script>
<style scoped></style>
