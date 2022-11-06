<template>
  <component
    :is="href ? 'a' : 'button'"
    :href="href"
    class="inline-flex items-center gap-1 no-underline hover:no-underline rounded justify-center leading-none transition-colors ease-in-out group"
    :class="{
      'border-app-button-borderWidth border-app-button-primary bg-app-button-primary text-app-button-primary hover:bg-app-button-primary-hover hover:text-app-button-primary-hover hover:border-app-button-primary-hover disabled:bg-app-button-primary-disabled disabled:text-app-button-primary-disabled disabled:border-app-button-primary-disabled active:bg-app-button-primary-active active:border-app-button-primary-active active:text-app-button-primary-active p-4':
        variant === 'primary',
      'border-app-button-borderWidth border-app-button-secondary bg-app-button-secondary text-app-button-secondary hover:bg-app-button-secondary-hover hover:text-app-button-secondary-hover hover:border-app-button-secondary-hover disabled:bg-app-button-secondary-disabled disabled:text-app-button-secondary-disabled disabled:border-app-button-secondary-disabled active:bg-app-button-secondary-active active:text-app-button-secondary-active active:border-app-button-secondary-active p-4':
        variant === 'secondary',
      'font-medium uppercase text-sm px-2 border-app-button-tertiary bg-app-button-tertiary text-app-button-tertiary hover:bg-app-button-tertiary-hover hover:text-app-button-tertiary-hover hover:border-app-button-tertiary-hover disabled:bg-app-button-tertiary-disabled disabled:text-app-button-tertiary-disabled active:bg-app-button-tertiary-active active:text-app-button-tertiary-active disabled:line-through':
        variant === 'tertiary',
    }"
    v-bind="$attrs"
  >
    <slot />
  </component>
</template>
<script setup lang="ts">
withDefaults(
  defineProps<{
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
