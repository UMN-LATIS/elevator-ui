<script setup lang="ts">
import { cn } from "@/lib/utils";
import {
  DropdownMenuTrigger,
  type DropdownMenuTriggerProps,
  useForwardProps,
} from "reka-ui";
import { computed, type HTMLAttributes } from "vue";

const props = defineProps<
  DropdownMenuTriggerProps & { class?: HTMLAttributes["class"] }
>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});

const forwarded = useForwardProps(delegatedProps);
</script>

<template>
  <DropdownMenuTrigger v-bind="forwarded" :class="cn(props.class)">
    <slot />
  </DropdownMenuTrigger>
</template>
