<template>
  <component
    :is="componentType"
    :class="
      cn([
        'button inline-flex items-center gap-1 no-underline hover:no-underline rounded justify-center leading-none transition-colors ease-in-out group cursor-pointer px-4 py-3',
        {
          'button--primary bg-primary text-on-primary': variant === 'primary',
          'button--secondary bg-secondary-container text-on-secondary-container':
            variant === 'secondary',
          'button--tertiary hover:bg-primary-container text-primary hover:text-on-primary-container text-xs uppercase font-medium p-2':
            variant === 'tertiary',
          'button--error bg-error-container text-on-error-container':
            variant === 'danger',
        },
        $attrs.class,
      ])
    "
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
import { cn } from "@/lib/utils";

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
.bg-primary {
  &:hover {
    background: color-mix(in oklch, var(--on-primary) 8%, var(--primary));
  }
  &:active {
    background: color-mix(in oklch, var(--on-primary) 12%, var(--primary));
  }
  &:focus-visible {
    background: color-mix(in oklch, var(--on-primary) 12%, var(--primary));
  }
}
.bg-secondary-container {
  &:hover {
    background: color-mix(
      in oklch,
      var(--on-secondary-container) 8%,
      var(--secondary-container)
    );
  }
  &:active {
    background: color-mix(
      in oklch,
      var(--on-secondary-container) 12%,
      var(--secondary-container)
    );
  }
  &:focus-visible {
    background: color-mix(
      in oklch,
      var(--on-secondary-container) 12%,
      var(--secondary-container)
    );
  }
}
.bg-primary-container {
  &:hover {
    background: color-mix(
      in oklch,
      var(--on-primary-container) 8%,
      var(--primary-container)
    );
  }
  &:active {
    background: color-mix(
      in oklch,
      var(--on-primary-container) 12%,
      var(--primary-container)
    );
  }
  &:focus-visible {
    background: color-mix(
      in oklch,
      var(--on-primary-container) 12%,
      var(--primary-container)
    );
  }
}
.bg-error-container {
  &:hover {
    background: color-mix(
      in oklch,
      var(--on-error-container) 8%,
      var(--error-container)
    );
  }
  &:active {
    background: color-mix(
      in oklch,
      var(--on-error-container) 12%,
      var(--error-container)
    );
  }
  &:focus-visible {
    background: color-mix(
      in oklch,
      var(--on-error-container) 12%,
      var(--error-container)
    );
  }
}
</style>
