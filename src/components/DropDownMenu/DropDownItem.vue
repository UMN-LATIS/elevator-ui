<template>
  <MenuItem v-slot="{ active }">
    <Link
      :href="href"
      :to="to"
      :class="[
        active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
        'block px-4 py-2 text-sm',
        current &&
          'font-bold border-l-2 border-neutral-900 bg-transparent-black-100',
      ]"
    >
      <slot />
    </Link>
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
<style scoped></style>
