<script setup lang="ts">
import { cn } from "@/lib/utils";
import {
  TagsInputRoot,
  type TagsInputRootEmits,
  type TagsInputRootProps,
  useForwardPropsEmits,
} from "reka-ui";
import { computed, type HTMLAttributes } from "vue";

const props = defineProps<
  TagsInputRootProps & { class?: HTMLAttributes["class"] }
>();
const emits = defineEmits<TagsInputRootEmits>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});

const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>

<template>
  <TagsInputRoot
    v-bind="forwarded"
    :class="
      cn(
        'tags-input-root flex flex-wrap gap-2 items-center rounded-md border border-input bg-surface-container-lowest px-3 py-1.5 text-sm focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-blue-600',
        props.class
      )
    ">
    <slot />
  </TagsInputRoot>
</template>
<style>
.tags-input-root input {
  border: none;
}
.tags-input-root input:focus {
  border: none;
  box-shadow: none;
}
</style>
