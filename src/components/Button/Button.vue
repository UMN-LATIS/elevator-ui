<template>
  <component
    :is="componentType"
    :class="
      cn([
        'button inline-flex items-center gap-1 no-underline hover:no-underline rounded justify-center leading-none transition-colors ease-in-out cursor-pointer ',
        variant !== 'tertiary' ? 'px-4 py-3' : '',
        {
          'bg-primary text-on-primary hover:bg-[--btn-primary-hover]':
            variant === 'primary',
          'bg-secondary-container text-on-secondary-container hover:bg-[--btn-secondary-hover]':
            variant === 'secondary',
          'text-primary hover:text-on-primary-container hover:bg-primary-container text-xs uppercase font-medium px-2 py-1':
            variant === 'tertiary',
          'bg-error-container text-on-error-container hover:bg-[--btn-danger-hover]':
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

<style scoped>
/* M3 filled button hover: on-X color mixed into bg at 8% opacity */
.button {
  --btn-primary-hover: color-mix(
    in oklch,
    var(--on-primary) 8%,
    var(--primary)
  );
  --btn-secondary-hover: color-mix(
    in oklch,
    var(--on-secondary-container) 8%,
    var(--secondary-container)
  );
  --btn-danger-hover: color-mix(
    in oklch,
    var(--on-error-container) 8%,
    var(--error-container)
  );
}
</style>
