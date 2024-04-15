<template>
  <div class="expandable-nav-section">
    <Disclosure v-slot="{ open }" as="div" class="space-y-1">
      <DisclosureButton
        class="group w-full flex items-center pl-2 pr-1 py-2 text-left font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 my-1 hover:bg-blue-100 hover:text-neutral-900"
      >
        <span class="flex-1">{{ label }}</span>
        <ChevronDownIcon
          class="w-5 h-5 text-neutral-400 group-hover:text-neutral-500 transform ease-in-out duration-150"
          :class="{ ' -rotate-90': !open }"
        />
      </DisclosureButton>
      <DisclosurePanel class="space-y-1 pl-8">
        <slot />
      </DisclosurePanel>
    </Disclosure>
  </div>
</template>
<script setup lang="ts">
import ChevronDownIcon from "@/icons/ChevronDownIcon.vue";
import { Disclosure, DisclosureButton, DisclosurePanel } from "@headlessui/vue";

defineProps<{
  label: string;
}>();
</script>
<style scoped>
.expandable-nav-section {
  color: var(--app-appMenu-textColor);
}
</style>
