<template>
  <component
    :is="href ? 'a' : 'button'"
    :href="href"
    :title="label"
    class="inline-flex items-center gap-2 no-underline hover:no-underline p-2 rounded-md border-2 border-neutral-900 justify-center leading-none text-neutral-900"
    :class="{
      'bg-neutral-900 text-white': variant === 'primary',
      'border-none uppercase text-xs font-bold hover:bg-neutral-200 transition-colors ease-in-out':
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
    iconPosition: "start" | "end";
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
