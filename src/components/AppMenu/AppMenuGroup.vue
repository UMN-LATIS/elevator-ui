<template>
  <div class="expandable-nav-section app-menu-group">
    <Disclosure v-slot="{ open }" as="div" class="space-y-1">
      <DisclosureButton
        class="disclosure-button group w-full flex items-center pl-2 pr-1 py-2 text-left font-medium focus:outline-none focus:ring-2 my-1">
        <span class="flex-1">{{ label }}</span>
        <ChevronDownIcon
          class="w-5 h-5 transform ease-in-out duration-150"
          :class="{ ' -rotate-90': !open }" />
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
.app-menu-group {
  color: var(--app-appMenuItem-textColor);

  & .disclosure-button {
    &:hover,
    &:focus,
    &:focus-within {
      background: var(
        --app-appMenuItem-hover-backgroundColor,
        var(--color-blue-50)
      );
      color: var(--app-appMenuItem-hover-textColor, var(--color-blue-600));
    }
  }
}
</style>
