<template>
  <div>
    <label
      :for="id"
      class="block text-xs font-medium text-neutral-700 uppercase mb-1"
      :class="[{ 'sr-only': labelHidden }, labelClass]"
    >
      {{ label }}
    </label>
    <div class="relative rounded-md">
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
        :value="modelValue"
        class="block w-full rounded-md border border-transparent focus-visible:ring-blue-600 focus-visible:ring-offset-2 focus-visible:ring-2 sm:text-sm py-2 bg-transparent-black-100 placeholder-transparent-black-400 px-4"
        :class="[
          {
            'pl-10': $slots.prepend,
            'pr-10': $slots.append,
          },
          inputClass,
        ]"
        v-bind="$attrs"
        @focus="$emit('focus', $event)"
        @blur="$emit('blur', $event)"
        @input="
          $emit('update:modelValue', ($event.target as HTMLInputElement).value)
        "
      />
      <div
        v-if="$slots.append"
        class="absolute inset-y-0 right-0 flex items-center pr-1"
      >
        <slot name="append" />
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
type CSSClass = Partial<Record<string, boolean>> | string | string[];

withDefaults(
  defineProps<{
    id: string;
    label: string;
    labelHidden?: boolean;
    modelValue: string;
    type?: string;
    inputClass?: CSSClass;
    labelClass?: CSSClass;
  }>(),
  {
    labelHidden: false,
    type: "text",
    inputClass: () => ({}),
    labelClass: () => ({}),
  }
);

defineEmits<{
  (eventName: "focus", event: FocusEvent): void;
  (eventName: "blur", event: FocusEvent): void;
  (eventName: "update:modelValue", value: string): void;
}>();
</script>
<style scoped></style>
