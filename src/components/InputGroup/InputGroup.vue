<template>
  <div class="input-group">
    <label
      :for="id"
      class="block text-xs font-medium uppercase mb-1 text-on-surface"
      :class="[{ 'sr-only': labelHidden }, labelClass]">
      {{ label }}
      <span v-if="required" class="text-error">*</span>
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
        :required="required"
        :class="
          cn([
            'block w-full rounded-md border-none focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-2 sm:text-sm py-2 bg-surface-container text-on-surface-container focus:bg-surface-bright px-4',
            {
              'pl-10': $slots.prepend,
              'pr-10': $slots.append,
              'input--is-blank': !model,
            },
            inputClass,
          ])
        "
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
<script setup lang="ts" generic="TModelValue = string | number | null">
import { CSSClass } from "@/types";
import { useId } from "vue";
import { cn } from "@/lib/utils";

withDefaults(
  defineProps<{
    id?: string;
    label: string;
    labelHidden?: boolean;
    type?: string;
    inputClass?: CSSClass;
    labelClass?: CSSClass;
    required?: boolean;
  }>(),
  {
    id: () => useId(),
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

const model = defineModel<TModelValue>({
  required: true,
});
</script>
<style scoped>
/* hack to show placeholder text for safari date inputs.
safari will show the current date if no value is set, even if a placeholder is set. */
@supports (font: -apple-system-body) and (-webkit-appearance: none) {
  /* target date inputs without values that are not focused and make the text
  safari shows transparent */
  input[type="date"].input--is-blank:not(:focus) {
    color: transparent;
  }
  /* then use a pseudo element to show the placeholder text */
  input[type="date"].input--is-blank:not(:focus)::before {
    content: attr(placeholder);
    color: var(--on-surface-variant);
  }
}
</style>
