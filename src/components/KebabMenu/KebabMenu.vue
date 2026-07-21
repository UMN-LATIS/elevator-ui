<script lang="ts">
import type { FunctionalComponent } from "vue";

export interface KebabMenuItem {
  label: string;
  icon?: FunctionalComponent;
  variant?: "danger";
  onSelect: () => void;
}
</script>

<script setup lang="ts">
import { EllipsisVerticalIcon } from "lucide-vue-next";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

defineProps<{
  // names the menu for screen readers, e.g. "Actions for Maps"
  label: string;
  items: KebabMenuItem[];
}>();
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger
      :aria-label="label"
      class="flex items-center justify-center aspect-square p-2 rounded-md transition-colors duration-150 text-primary hover:bg-primary-container hover:text-on-primary-container focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
      <EllipsisVerticalIcon class="size-4" />
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem
        v-for="item in items"
        :key="item.label"
        :class="
          cn(
            item.variant === 'danger' &&
              'text-error data-[highlighted]:bg-error-container data-[highlighted]:text-on-error-container'
          )
        "
        @select="item.onSelect()">
        <component :is="item.icon" v-if="item.icon" class="size-4" />
        {{ item.label }}
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
