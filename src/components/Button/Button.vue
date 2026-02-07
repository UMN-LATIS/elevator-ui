<template>
  <component
    :is="componentType"
    class="button inline-flex items-center gap-1 no-underline hover:no-underline rounded justify-center leading-none transition-colors ease-in-out group cursor-pointer"
    :class="{
      'button--primary px-4 py-3': variant === 'primary',
      'button--secondary px-4 py-3': variant === 'secondary',
      'button--tertiary text-xs uppercase font-medium p-2':
        variant === 'tertiary',
      'button--primary px-4 py-3 !bg-error !border-error !text-on-error hover:!bg-error/90 hover:!border-error/90':
        variant === 'danger',
    }"
    v-bind="$attrs"
    :to="componentType === RouterLink ? to : undefined"
    :href="resolvedHref"
    :type="componentType === 'button' ? type : undefined">
    <slot />
  </component>
</template>
<script setup lang="ts">
import { computed } from "vue";
import { RouterLink, type RouteLocationRaw, useRouter } from "vue-router";

const props = withDefaults(
  defineProps<{
    href?: string;
    to?: RouteLocationRaw;
    variant?: "primary" | "secondary" | "tertiary" | "danger";
    type?: "button" | "submit" | "reset";
  }>(),
  {
    variant: "secondary",
    href: undefined,
    to: undefined,
    type: "button",
  }
);

const router = useRouter();
const resolvedHref = computed(() => {
  if (props.href) {
    return props.href;
  } else if (props.to && componentType.value === RouterLink) {
    // If `to` is an object, resolve it to a string URL
    return router.resolve(props.to).href;
  }
  return undefined;
});

const componentType = computed(() => {
  if (props.href) return "a";
  if (props.to) return RouterLink;
  return "button";
});
</script>
<style lang="postcss" scoped>
.button {
  /* using variables to derive different states for variants */
  /* defaulting to secondary */
  --bg: var(--secondary);
  --on-bg: var(--on-secondary);
  background: var(--bg);
  color: var(--on-bg);
  border-color: var(--bg);
  border-width: 2px;
  border-style: solid;

  &:hover:not(:disabled) {
    color: var(--on-bg);
    background: color-mix(in oklch, var(--bg) 90%, transparent);
    border-color: color-mix(in oklch, var(--bg) 90%, transparent);
  }

  &:active {
    background: color-mix(in oklch, var(--bg) 80%, transparent);
    border-color: color-mix(in oklch, var(--bg) 80%, transparent);
  }

  &:disabled {
    opacity: 0.37;
    filter: saturate(0);
    cursor: not-allowed;
  }
}

/* Primary button: filled in light mode, outlined in dark mode */
.button--primary {
  --bg: var(--primary);
  --on-bg: var(--on-primary);
}

/* Secondary button: outlined */
.button--secondary {
  background: transparent;
  border-color: var(--secondary);
  color: var(--secondary);
}

/* Tertiary button: text only, uses warm accent in dark mode */
.button--tertiary {
  --bg: transparent;
  --on-bg: var(--primary);
  border-color: transparent;

  &:hover {
    background: color-mix(in oklch, var(--bg) 50%, transparent);
  }

  &:active {
    color: var(--primary);
    background: var(--primary-container);
  }

  &:disabled {
    cursor: not-allowed;
    color: color-mix(in oklch, var(--on-surface) 38%, transparent);
    background: transparent;
  }
}
</style>
