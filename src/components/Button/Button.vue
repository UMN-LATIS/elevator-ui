<template>
  <component
    :is="componentType"
    class="button inline-flex items-center gap-1 no-underline hover:no-underline rounded justify-center leading-none transition-colors ease-in-out group"
    :class="{
      'button--primary px-4 py-3': variant === 'primary',
      'button--secondary px-4 py-3': variant === 'secondary',
      'button--tertiary text-xs uppercase font-medium p-2 -ml-2':
        variant === 'tertiary',
    }"
    v-bind="$attrs"
    :to="to"
    :href="href"
  >
    <slot />
  </component>
</template>
<script setup lang="ts">
import { computed } from "vue";
import { RouterLink } from "vue-router";

const props = withDefaults(
  defineProps<{
    href?: string;
    to?: string;
    variant?: "primary" | "secondary" | "tertiary";
  }>(),
  {
    variant: "secondary",
    href: undefined,
    to: undefined,
  }
);

const componentType = computed(() => {
  if (props.href) return "a";
  if (props.to) return RouterLink;
  return "button";
});
</script>
<style lang="postcss">
.button {
  border-width: var(--app-button-borderWidth);
  border-style: solid;
  font-weight: var(--app-button-fontWeight);
}
.button--primary {
  color: var(--app-button-primary-textColor);
  background: var(--app-button-primary-backgroundColor);
  border-color: var(--app-button-primary-borderColor);
  &:hover {
    color: var(--app-button-primary-hover-textColor);
    background: var(--app-button-primary-hover-backgroundColor);
    border-color: var(--app-button-primary-hover-borderColor);
  }
  &:active {
    color: var(--app-button-primary-active-textColor);
    background: var(--app-button-primary-active-backgroundColor);
    border-color: var(--app-button-primary-active-borderColor);
  }
  &:disabled {
    color: var(--app-button-primary-disabled-textColor);
    background: var(--app-button-primary-disabled-backgroundColor);
    border-color: var(--app-button-primary-disabled-borderColor);
  }
}

.button--secondary {
  color: var(--app-button-secondary-textColor);
  background: var(--app-button-secondary-backgroundColor);
  border-color: var(--app-button-secondary-borderColor);
  &:hover {
    color: var(--app-button-secondary-hover-textColor);
    background: var(--app-button-secondary-hover-backgroundColor);
    border-color: var(--app-button-secondary-hover-borderColor);
  }
  &:active {
    color: var(--app-button-secondary-active-textColor);
    background: var(--app-button-secondary-active-backgroundColor);
    border-color: var(--app-button-secondary-active-borderColor);
  }
  &:disabled {
    color: var(--app-button-secondary-disabled-textColor);
    background: var(--app-button-secondary-disabled-backgroundColor);
    border-color: var(--app-button-secondary-disabled-borderColor);
  }
}

.button--tertiary {
  color: var(--app-button-tertiary-textColor);
  background: var(--app-button-tertiary-backgroundColor);
  border-color: var(--app-button-tertiary-borderColor);
  border: none;
  &:hover {
    color: var(--app-button-tertiary-hover-textColor);
    background: var(--app-button-tertiary-hover-backgroundColor);
    border-color: var(--app-button-tertiary-hover-borderColor);
  }
  &:active {
    color: var(--app-button-tertiary-active-textColor);
    background: var(--app-button-tertiary-active-backgroundColor);
    border-color: var(--app-button-tertiary-active-borderColor);
  }
  &:disabled {
    text-decoration: line-through;
    color: var(--app-button-tertiary-disabled-textColor);
    background: var(--app-button-tertiary-disabled-backgroundColor);
    border-color: var(--app-button-tertiary-disabled-borderColor);
  }
}
</style>
