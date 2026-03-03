<template>
  <component
    :is="componentType"
    :class="
      cn([
        'button inline-flex items-center gap-1 no-underline hover:no-underline rounded justify-center leading-none transition-colors ease-in-out cursor-pointer ',
        variant === 'tertiary'
          ? 'p-2 text-xs uppercase font-medium'
          : 'px-4 py-3',
        {
          'bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container':
            variant === 'primary',
          'bg-secondary-container text-on-secondary-container hover:bg-secondary hover:text-on-secondary':
            variant === 'secondary',
          'text-primary hover:text-on-primary-container hover:bg-primary-container text-xs uppercase font-medium px-2 py-1':
            variant === 'tertiary',
          'bg-error-container text-on-error-container': variant === 'danger',
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

<style scoped></style>
