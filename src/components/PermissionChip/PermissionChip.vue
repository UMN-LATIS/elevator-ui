<template>
  <Chip :class="cn('max-w-full border', toneClass)">
    <LoaderCircleIcon v-if="isPending" class="size-3 shrink-0 animate-spin" />
    <i
      v-else
      :class="[
        'size-2 shrink-0 rounded-full',
        permissionDotClass(levelNumber),
      ]" />
    <span class="truncate">{{ label }}</span>
  </Chip>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { LoaderCircleIcon } from "lucide-vue-next";
import Chip from "@/components/Chip/Chip.vue";
import { cn } from "@/lib/utils";
import {
  permissionChipClass,
  permissionDotClass,
} from "@/helpers/permissionLevelColors";

const props = withDefaults(
  defineProps<{
    // a PermissionLevel.level, not a level id
    levelNumber: number;
    label: string;
    // the level is submitted but not yet reconciled, so the chip names it
    // without claiming the color of a level that may not stick
    isPending?: boolean;
  }>(),
  { isPending: false }
);

const toneClass = computed((): string =>
  props.isPending
    ? "border-outline-variant bg-surface text-on-surface-variant"
    : permissionChipClass(props.levelNumber)
);
</script>
