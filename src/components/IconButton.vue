<template>
  <component
    :is="href ? 'a' : 'button'"
    :href="href"
    :title="label"
    class="inline-flex items-center gap-2 no-underline hover:no-underline"
  >
    <span
      class="material-symbols-outlined"
      :class="{
        'text-sm': size === 'sm',
        'text-md': size === 'md',
        'text-lg': size === 'lg',
      }"
    >
      {{ icon }}
    </span>
    <span class="sr-only">{{ label }}</span>
    <slot />
  </component>
</template>
<script setup lang="ts">
withDefaults(
  defineProps<{
    label: string;
    icon: string;
    href?: string;
    size?: "sm" | "md" | "lg";
  }>(),
  {
    href: undefined,
    size: "md",
  }
);
</script>
<style scoped></style>
