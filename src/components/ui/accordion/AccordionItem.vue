<script setup lang="ts">
import { cn } from "@/lib/utils";
import {
  AccordionItem,
  type AccordionItemProps,
  useForwardProps,
} from "reka-ui";
import { computed, type HTMLAttributes } from "vue";

const props = defineProps<
  AccordionItemProps & { class?: HTMLAttributes["class"] }
>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});

const forwarded = useForwardProps(delegatedProps);
</script>

<template>
  <AccordionItem
    v-bind="forwarded"
    :class="
      cn(
        'border border-outline-variant rounded-lg overflow-hidden',
        props.class
      )
    ">
    <slot />
  </AccordionItem>
</template>
