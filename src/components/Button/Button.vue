<template>
  <component
    :is="href ? 'a' : 'button'"
    :href="href"
    :title="label"
    class="inline-flex items-center gap-2 no-underline hover:no-underline p-2 rounded border-2 justify-center leading-none transition-colors ease-in-out"
    :class="{
      'bg-neutral-900 border-neutral-900 text-white hover:bg-blue-600 hover:border-blue-600':
        variant === 'primary',
      ' border-neutral-900 text-neutral-900 hover:text-blue-600 hover:border-blue-600':
        variant === 'secondary',
      'bg-transparent-white-600 shadow-sm px-4 py-2 font-normal uppercase text-xs border-none hover:bg-white text-neutral-900 hover:text-blue-600 ':
        variant === 'tertiary',
      'flex-row-reverse': iconPosition === 'start',
    }"
  >
    <slot />
    <div v-if="icon" class="inline-flex place-content-center">
      <span class="material-symbols-outlined text-lg">
        {{ icon }}
      </span>
      <span class="sr-only">{{ label }}</span>
    </div>
  </component>
</template>
<script setup lang="ts">
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
