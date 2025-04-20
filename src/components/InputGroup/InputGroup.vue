<template>
  <div class="input-group">
    <label
      :for="id"
      class="block text-xs font-medium text-neutral-700 uppercase mb-1"
      :class="[{ 'sr-only': labelHidden }, labelClass]">
      {{ label }}
      <span v-if="required" class="text-red-600">*</span>
    </label>
    <div class="relative rounded-md">
      <div
        v-if="$slots.prepend"
        class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
        <slot name="prepend" />
      </div>
      <input
        :id="id"
        v-model="model"
        :type="type"
        :name="id"
        class="block w-full rounded-md border border-transparent focus-visible:ring-blue-600 focus-visible:ring-offset-2 focus-visible:ring-2 sm:text-sm py-2 bg-transparent-black-100 placeholder-transparent-black-400 px-4"
        :required="required"
        :class="[
          {
            'pl-10': $slots.prepend,
            'pr-10': $slots.append,
          },
          inputClass,
        ]"
        v-bind="$attrs"
        @focus="$emit('focus', $event)"
        @blur="$emit('blur', $event)" />
      <div
        v-if="$slots.append"
        class="absolute inset-y-0 right-0 flex items-center pr-1">
        <slot name="append" />
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { CSSClass } from "@/types";

withDefaults(
  defineProps<{
    id: string;
    label: string;
    labelHidden?: boolean;
    type?: string;
    inputClass?: CSSClass;
    labelClass?: CSSClass;
    required?: boolean;
  }>(),
  {
    labelHidden: false,
    type: "text",
    required: false,
    inputClass: () => ({}),
    labelClass: () => ({}),
  }
);

defineEmits<{
  (eventName: "focus", event: FocusEvent): void;
  (eventName: "blur", event: FocusEvent): void;
}>();

const model = defineModel<string | number, "number">({
  required: true,
});
</script>
<style scoped></style>
