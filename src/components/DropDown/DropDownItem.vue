<template>
  <MenuItem v-slot="{ active }" class="dropdown-item">
    <component
      :is="$attrs.disabled ? 'span' : Link"
      class="block px-4 py-2 text-sm !no-underline"
      :class="{
        'bg-blue-50 !text-blue-900': active,
        'text-gray-700': !active,
        'font-bold border-l-2 border-neutral-900 bg-transparent-black-100':
          current,
      }"
      :href="href"
      :to="to"
    >
      <slot />
    </component>
  </MenuItem>
</template>
<script setup lang="ts">
import { MenuItem } from "@headlessui/vue";
import Link from "@/components/Link/Link.vue";
defineProps<{
  href?: string;
  to?: string;
  current?: boolean;
}>();
</script>
<style scoped>
[disabled="true"] {
  opacity: 0.3;
}
</style>
