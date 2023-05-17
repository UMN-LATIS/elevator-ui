<template>
  <div
    :class="{ hidden: !isOpen, block: isOpen }"
    class="bg-white rounded-lg shadow-md w-full relative"
  >
    <XButton class="absolute top-4 right-4" @click="$emit('close')" />
    <div class="p-4">
      <h1 class="uppercase font-medium text-xs text-neutral-900 my-2">
        Advanced Search
      </h1>
      <p>
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Dolorum
        aspernatur placeat id fugit velit eius vitae, impedit, iusto unde
        explicabo eveniet accusantium repellat, eligendi possimus animi
        provident quos sunt nulla.
      </p>
    </div>
    <div
      class="flex bg-transparent-black-100 px-4 py-2 justify-end items-center gap-4"
    >
      <Button variant="tertiary">Reset All</Button>
      <Button variant="primary">Search</Button>
    </div>
  </div>
</template>
<script setup lang="ts">
import XButton from "@/components/XButton/XButton.vue";
import Button from "@/components/Button/Button.vue";
defineProps<{
  isOpen: boolean;
}>();

defineEmits<{
  (eventName: "close", event: Event): void;
}>();
</script>
<style scoped></style>
