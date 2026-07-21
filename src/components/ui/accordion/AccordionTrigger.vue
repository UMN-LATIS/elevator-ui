<script setup lang="ts">
import { cn } from "@/lib/utils";
import { ChevronRightIcon } from "lucide-vue-next";
import {
  AccordionHeader,
  AccordionTrigger,
  type AccordionTriggerProps,
  useForwardProps,
} from "reka-ui";
import { computed, type HTMLAttributes } from "vue";

const props = defineProps<
  AccordionTriggerProps & { class?: HTMLAttributes["class"] }
>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});

const forwarded = useForwardProps(delegatedProps);
</script>

<template>
  <AccordionHeader class="flex">
    <AccordionTrigger
      v-bind="forwarded"
      :class="
        cn(
          'group flex flex-1 items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-container-low focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
          props.class
        )
      ">
      <ChevronRightIcon
        class="size-4 shrink-0 text-on-surface-variant transition-transform duration-200 group-data-[state=open]:rotate-90" />
      <slot />
    </AccordionTrigger>
  </AccordionHeader>
</template>
