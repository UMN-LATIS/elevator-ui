<template>
  <component
    :is="href ? 'a' : 'button'"
    :href="href"
    :title="label"
    class="inline-flex items-center gap-2 no-underline hover:no-underline p-4 rounded-md border-2 border-neutral-900 justify-center leading-none text-neutral-900"
    :class="{
      'bg-neutral-900 text-white': variant === 'primary',
      'border-neutral-100 uppercase text-xs font-bold bg-neutral-100 hover:bg-neutral-200 transition-colors ease-in-out':
        variant === 'tertiary',
    }"
  >
    <slot />
    <div v-if="icon" class="inline-flex place-content-center">
      <span class="material-icons-outlined">
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
    label?: string;
    href?: string;
    variant?: "primary" | "secondary" | "tertiary";
  }>(),
  {
    icon: undefined,
    variant: "secondary",
    label: undefined,
    href: undefined,
  }
);
</script>
<style scoped></style>
