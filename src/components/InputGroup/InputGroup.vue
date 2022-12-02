<template>
  <div>
    <label
      :for="id"
      class="block text-sm font-medium text-gray-700"
      :class="{ 'sr-only': labelHidden }"
    >
      {{ label }}
    </label>
    <div class="relative mt-1 rounded-md shadow-sm">
      <div
        v-if="$slots.prepend"
        class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"
      >
        <slot name="prepend" />
      </div>
      <input
        :id="id"
        :type="type"
        :name="id"
        class="block w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 bg-transparent-black-100"
        :class="{
          'pl-10': $slots.prepend,
          'pr-10': $slots.append,
        }"
      />
      <div
        v-if="$slots.append"
        class="absolute inset-y-0 right-0 flex items-center pr-3"
      >
        <slot name="append" />
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
withDefaults(
  defineProps<{
    id: string;
    label: string;
    labelHidden?: boolean;
    type?: string;
  }>(),
  {
    labelHidden: false,
    type: "text",
  }
);
</script>
<style scoped></style>
