<template>
  <div>
    <div class="flex justify-between items-baseline">
      <slot name="label">
        <label
          for="share-embed"
          class="block text-sm font-medium text-gray-700"
        >
          {{ label }}
        </label>
      </slot>
      <div>
        <slot name="corner" />
      </div>
    </div>
    <div class="mt-1 flex rounded-md shadow-sm relative">
      <textarea
        id="share-embed"
        name="share-embed"
        class="block w-full rounded border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 font-mono text-neutral-500 focus:text-neutral-900 h-24"
        :placeholder="placeholder"
        :value="value"
        @input="(event) => $emit('input', event)"
      />
    </div>
  </div>
</template>
<script setup lang="ts">
withDefaults(
  defineProps<{
    label: string;
    value: string;
    placeholder?: string;
  }>(),
  {
    placeholder: "",
  }
);

defineEmits<{
  (eventName: "input", event: Event);
}>();
</script>
<style scoped></style>
