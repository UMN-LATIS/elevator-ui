<template>
  <MenuItem
    v-slot="{ active }"
    class="dropdown__dropdown-item"
    :disabled="disabled">
    <component
      :is="is || ($attrs.disabled ? 'div' : Link)"
      class="block px-4 py-2 text-sm !no-underline"
      :class="{
        'bg-primary-container !text-primary': active,
        'text-on-surface-variant': !active,
        'font-bold border-l-2 border-outline bg-surface-container': current,
      }"
      :href="href"
      :to="to">
      <slot />
    </component>
  </MenuItem>
</template>
<script setup lang="ts">
import { MenuItem } from "@headlessui/vue";
import Link from "@/components/Link/Link.vue";
defineProps<{
  is?: string;
  href?: string;
  to?: string;
  current?: boolean;
  disabled?: boolean;
}>();
</script>
<style scoped>
[disabled="true"] {
  opacity: 0.3;
}
</style>
