<template>
  <Link
    :href="href"
    :to="to"
    class="flex items-center gap-2.5 py-2 px-2.5 rounded-[6px] text-[0.8125rem] font-medium text-[--on-surface-variant] no-underline hover:bg-on-surface-hover hover:text-[--on-surface] [&.is-active]:bg-[--primary-container] [&.is-active]:text-[--on-primary-container] [&.is-active]:font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-[--primary] focus-visible:outline-offset-2"
    :activeClass="exact ? '' : 'is-active'"
    exactActiveClass="is-active"
    :class="{ 'is-active': isActiveByRouteName }">
    <component
      :is="icon"
      v-if="icon"
      class="w-4 h-4 shrink-0"
      aria-hidden="true" />
    <span class="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
      <slot />
    </span>
  </Link>
</template>

<script setup lang="ts">
import Link from "@/components/Link/Link.vue";
import { computed } from "vue";
import { useRoute, type RouteLocationRaw } from "vue-router";
import type { Component } from "vue";

const props = withDefaults(
  defineProps<{
    href?: string;
    to?: RouteLocationRaw;
    icon?: Component;
    exact?: boolean;
    // Routes that should light this item up but do not sit under its path,
    // so vue-router's own prefix matching misses them.
    activeForRouteNames?: string[];
  }>(),
  {
    href: undefined,
    to: undefined,
    icon: undefined,
    exact: false,
    activeForRouteNames: undefined,
  }
);

const route = useRoute();
const isActiveByRouteName = computed((): boolean =>
  Boolean(props.activeForRouteNames?.includes(String(route.name)))
);
</script>
