<template>
  <div class="flex flex-col gap-1">
    <label :for="id" class="text-xs uppercase font-semibold">
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>
    <select
      :id="id"
      :value="modelValue"
      class="rounded-md border-none bg-black/5"
      readonly
      required
      @change="
        $emit('update:modelValue', ($event.target as HTMLSelectElement).value)
      ">
      <option value="" disabled selected>{{ placeholder }}</option>
      <option v-for="opt in options" :key="opt.id" :value="opt.id">
        {{ opt.label }}
      </option>
    </select>
  </div>
</template>
<script setup lang="ts">
withDefaults(
  defineProps<{
    modelValue: string;
    label: string;
    options: Array<{
      id: string;
      label: string;
    }>;
    required?: boolean;
    id?: string;
    placeholder?: string;
  }>(),
  {
    id: () => `select-${crypto.randomUUID()}`,
    placeholder: "--",
    required: false,
  }
);

defineEmits<{
  (e: "update:modelValue", value: string): void;
}>();
</script>
<style scoped></style>
